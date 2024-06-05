#  <img src="https://github.com/cristianbass01/Explainable-AI-Project/blob/a542b372104b3af7a3da6159b14f64f313356c65/src/counterfactual-ui/src/images/logo.png" alt="Logo" width="50" height="50"> Catterfactuals

## Visual and interactive counterfactual explanations for models on tabular data

A counterfactual explanation is a popular approach to explaining predictive models that works by answering the question: what (minimal) changes do we have to make to get a different prediction?

A fair amount of work has been done on generating counterfactual explanations, but it seems only a small part of that is on visual and interactive
explanations, both of which are typically better for the user.

In this project we'll review the related work on visual and interactive counterfactual explanations for tabular data, evaluate existing solutions, identify their advantages and flaws, potentially with a user study, and, as a final challenge, try to improve on related work.

## How to run 
#### Backend: 
1) Install requirements.txt
2) Go to src/backend/counterfactual
3) Execute "python manage.py migrate"
4) Execute "python manage.py runserver". (make sure to run from the root directory)

#### Frontend:
1) Install npm
2) Go to counterfactuals-ui directory
3) Execute "npm install"
4) Execute "npm start"

## Adding more generators 
Currently we support only DiCE. To add more counterfactual generation methods we require you to implement the AbstractCounterfactualGenerator class with your generation algorithm and it should work.

## UI
This is how our UI looks. For more details refer to the final report.
![REACT UI](./figures/React-App.pdf)

## Advisor: prof. Erik Štrumbelj
