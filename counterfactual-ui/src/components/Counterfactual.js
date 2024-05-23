import React, { useEffect, useState } from 'react';
import { Card, CardContent, Typography, Divider } from '@mui/material';
import FeatureList from './FeatureList';
import HiddenFeatureList from './HiddenFeatureList';

const Counterfactual = ({ counterfactual, inputFeatures, datasetName, setInputFeatures, modelName, targetVariable, generateCounterfactualRef }) => {
  const [selectedCounterfactual, setSelectedCounterfactual] = useState(null);
  const [features, setFeatures] = useState(inputFeatures);

  useEffect(() => {
    console.log("Counterfactual updated:", counterfactual);
    setSelectedCounterfactual({ ...counterfactual, hiddenFeatures: [], features: inputFeatures });
  }, [counterfactual, inputFeatures]);

  const transformDatasetToInputFeatures = (dataset) => {
    return Object.keys(dataset.columns).map((column) => ({
      name: column,
      type: dataset.columns[column].type,
      values: dataset.columns[column].values,
      locked: false,
    }));
  };

  useEffect(() => {
    console.log("Dataset name:", datasetName);
    console.log("Model name:", modelName);
    console.log("Target variable:", targetVariable);

    // fetch the dataset based on the dataset name
    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:8000/datasets/');
        const data = await response.json();
        //find the dataset with the name datasetName
        console.log(Object.values(data.datasets));
        const dataset = Object.values(data.datasets).find(d => d.title === "processed_data"); //TODO: change to datasetName

        if (!dataset) {
          console.error("Dataset not found");
          return;
        }
        console.log("Dataset found:", dataset);
        // eslint-disable-next-line
        inputFeatures = transformDatasetToInputFeatures(dataset);
        const transformedFeatures = transformDatasetToInputFeatures(dataset);
        console.log("Transformed features:", transformedFeatures);
        setFeatures(transformedFeatures);
        //Remove the target variable from the features
        const targetIndex = transformedFeatures.findIndex(feature => feature.name === targetVariable);
        transformedFeatures.splice(targetIndex, 1);
        setInputFeatures(transformedFeatures);
      } catch (error) {
        console.error('Error fetching dataset:', error);
      }
    }

    fetchData();

  }, [datasetName, setInputFeatures]);

  if (!selectedCounterfactual) {
    return <div>Loading...</div>;
  }

  const hideFeature = (index) => {
    const featureToHide = selectedCounterfactual.features[index];
    const updatedFeatures = selectedCounterfactual.features.filter((_, i) => i !== index);
    const updatedHiddenFeatures = [...selectedCounterfactual.hiddenFeatures, featureToHide];
    setSelectedCounterfactual({ ...selectedCounterfactual, features: updatedFeatures, hiddenFeatures: updatedHiddenFeatures });
  };

  const showFeature = (index) => {
    const featureToShow = selectedCounterfactual.hiddenFeatures[index];
    const updatedHiddenFeatures = selectedCounterfactual.hiddenFeatures.filter((_, i) => i !== index);
    const updatedFeatures = [...selectedCounterfactual.features, featureToShow];
    setSelectedCounterfactual({ ...selectedCounterfactual, hiddenFeatures: updatedHiddenFeatures, features: updatedFeatures });
  };

  const toggleLock = (index, isHidden) => {
    if (isHidden) {
      const updatedHiddenFeatures = [...selectedCounterfactual.hiddenFeatures];
      updatedHiddenFeatures[index].locked = !updatedHiddenFeatures[index].locked;
      setSelectedCounterfactual({ ...selectedCounterfactual, hiddenFeatures: updatedHiddenFeatures });
    } else {
      const updatedFeatures = [...selectedCounterfactual.features];
      updatedFeatures[index].locked = !updatedFeatures[index].locked;
      setSelectedCounterfactual({ ...selectedCounterfactual, features: updatedFeatures });
    }
  };

  const parseCounterfactual = (raw_data) => {

    console.log("Parsing counterfactual...");
    return raw_data.map(item => {

      // Initialize the counterfactual features, changes, and hidden features
      const CounterfactualFeatures = [];
      const changes = [];
      const hiddenFeatures = [];

      // Extract the input and prediction probabilities
      const inputProbability = (item.original_probability * 100).toFixed(2);
      const predictionProbability = (item.probability * 100).toFixed(2);

      // Extract the features
      for (let feature of features) {
        if (feature === targetVariable) {
          continue; // Skip the target variable
        }

        // Create a dictionary for each feature
        const featureDict = {};

        // Extract the feature name, counterfactual, value, and lock status
        featureDict['name'] = feature.name;
        featureDict['value'] = feature.value;
        featureDict['counterfactual'] = item[feature.name];
        //Change true and false to 1 and 0 in feature value
        if (featureDict['value'] === true || featureDict['value'] === 'true') {
          featureDict['value'] = "1";
        }
        else if (featureDict['value'] === false || featureDict['value'] === 'false') {
          featureDict['value'] = "0"
        }
        featureDict['locked'] = false;
        featureDict['changed'] = String(featureDict['value']) !== String(featureDict['counterfactual']);
        if (featureDict['changed']) {
          changes.push(feature.name);
        }
        if (feature.isHidden || !featureDict['changed']) {
          hiddenFeatures.push(featureDict);
        }
        else {
          CounterfactualFeatures.push(featureDict);
        }

        console.log("Feature dict:", featureDict);

      }
      // Add to a counterFactual to return
      const counterFactual = {}
      counterFactual['inputProbability'] = inputProbability;
      counterFactual['predictionProbability'] = predictionProbability;
      counterFactual['changes'] = changes;
      counterFactual['features'] = CounterfactualFeatures;
      counterFactual['hiddenFeatures'] = hiddenFeatures;
      return counterFactual;
    });

  }

  const generateCounterfactual = async () => {
    console.log("Generating counterfactual...");
    try {
      const query = features.reduce((acc, feature) => {

        console.log("Feature:", feature);
        if (feature.type === 'categorical') {
          if (feature.value === 'true') {
            acc[feature.name] = 1;
          }
          else if (feature.value === 'false') {
            acc[feature.name] = 0;
          }
          else {
            acc[feature.name] = parseInt(feature.value)
          }
        }
        else if (feature.type === 'numeric') {
          acc[feature.name] = parseFloat(feature.value);
        }
        return acc;
      }, {});

      const response = await fetch('http://localhost:8000/counterfactual/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0',
        },
        body: JSON.stringify({
          query: query,
          modelName: "model",
          dataset: "processed_data",
          type: 'DICE',
          featuresToVary: features.filter(feature => !feature.locked).map(feature => feature.name),
        }),
      });

      const data = await response.json();

      console.log("Generated counterfactual:", data);

      // Update the state with the received counterfactual
      if (data) {
        // setSelectedCounterfactual(data);
        const newCounterFactual = parseCounterfactual(data);
        console.log("New counterfactual:", newCounterFactual);
        const updatedFeatures = newCounterFactual[0].features;
        const updatedHiddenFeatures = newCounterFactual[0].hiddenFeatures;
        setSelectedCounterfactual({ ...selectedCounterfactual, features: updatedFeatures, hiddenFeatures: updatedHiddenFeatures });

      } else {
        console.error("Counterfactual not generated:", data);
      }
    } catch (error) {
      console.error('Error generating counterfactual:', error);
    }
  };

  generateCounterfactualRef.current = generateCounterfactual;


  return (
    <Card style={{ margin: '20px', backgroundColor: '#f0f0f0' }}>
      <CardContent>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <Typography variant="body1" style={{ fontFamily: 'Pacifico, cursive' }}>Input</Typography>
            <Typography variant="h6" style={{ fontFamily: 'Pacifico, cursive' }}>{selectedCounterfactual.inputProbability}% Non-Diabetic</Typography>
          </div>
          <div>
            <Typography variant="body1" style={{ fontFamily: 'Pacifico, cursive' }}>Counterfactual</Typography>
            <Typography variant="h6" style={{ color: 'red', fontFamily: 'Pacifico, cursive' }}>{selectedCounterfactual.predictionProbability}% Diabetic</Typography>
          </div>
        </div>
        <Divider />
        <FeatureList features={selectedCounterfactual.features} title="Features" onHideFeature={hideFeature} onLockToggle={(index) => toggleLock(index, false)} />
        <HiddenFeatureList features={selectedCounterfactual.hiddenFeatures} title="Hidden Features" onShowFeature={showFeature} onLockToggle={(index) => toggleLock(index, true)} />
      </CardContent>
    </Card>
  );
};

export default Counterfactual;