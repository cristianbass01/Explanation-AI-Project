from django.db import models
import dice_ml
from dice_ml.utils import helpers # helper functions
from sklearn.model_selection import train_test_split
import numpy as np
import pandas as pd
import json
from counterfactual.models.counterfactualBinner import CounterfactualBinner
from counterfactual.models.globalBinner import GlobalBinner
from typing import Tuple

class DiceGenerator(models.Model):
    def __init__(self, model, dataset):
        super().__init__()
        target_name = dataset.get_target()
        numeric_feats = dataset.get_numeric_feat()

        dataset = dataset.get_dataset()
        target = dataset[target_name]
        self.target_name = target_name
        d = dice_ml.Data(dataframe=dataset,
                         # TODO: is this correct?
                         continuous_features=numeric_feats,
                         outcome_name=target_name)


        # TODO: FIX this hack
        func = None
        if model.get_title() == "adult_income":
            func="ohe-min-max"

        self.to_add_probabilities = (model.get_type() == "sklearn")
        self.model = model.get_model()

        m = dice_ml.Model(model = model.get_model(),
                          backend = model.get_type(), func=func)
        
        self.gen = dice_ml.Dice(d,m)
    
    def add_probabilities(self, cf: pd.DataFrame):
        diabetes = cf['diabetes']

        cf.drop(columns=[self.target_name], inplace=True)
        res = self.model.predict_proba(cf)
        cf['probability'] = np.max(res, axis=1)

        cf['diabetes'] = diabetes
        return cf
    
    def get_counterfactuals(self, query_instance: pd.DataFrame = None, features_to_vary: str = "all", count: int = 1) -> Tuple[pd.DataFrame, pd.DataFrame]:
        cfs = self.gen.generate_counterfactuals(query_instance, total_CFs=count, desired_class="opposite", features_to_vary=features_to_vary)
        counterfactuals = cfs.cf_examples_list[0].final_cfs_df

        if self.to_add_probabilities:
            original_prob = np.max(self.model.predict_proba(query_instance)[0])
            query_instance[self.target_name] = self.model.predict(query_instance)[0]
            query_instance['probability'] = original_prob
            counterfactuals = self.add_probabilities(counterfactuals)

        return counterfactuals, query_instance


    