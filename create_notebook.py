import json

notebook = {
    "cells": [
        {
            "cell_type": "markdown",
            "metadata": {},
            "source": [
                "# Maize Yield Prediction in Central Europe\n",
                "\n",
                "This notebook implements the methodology from the MDPI paper:\n",
                "**\"Data Mining and Machine Learning Algorithms for Optimizing Maize Yield Forecasting in Central Europe\"**.\n",
                "\n",
                "It predicts maize yield using various agricultural and climate data scenarios and compares the performance of 4 machine learning algorithms (Bagging, Decision Table proxy, Random Forest, and ANN-MLP). Crucially, to replicate WEKA's implicit data handling, both the feature vectors and the target yield vectors are Standardized, and the `lbfgs` optimizer is applied to ensure full convergence accuracy."
            ]
        },
        {
            "cell_type": "code",
            "execution_count": None,
            "metadata": {},
            "outputs": [],
            "source": [
                "import pandas as pd\n",
                "import numpy as np\n",
                "import warnings\n",
                "warnings.filterwarnings('ignore')\n",
                "\n",
                "from sklearn.model_selection import train_test_split, KFold\n",
                "from sklearn.preprocessing import StandardScaler\n",
                "from sklearn.metrics import mean_absolute_error, mean_squared_error\n",
                "\n",
                "# Models\n",
                "from sklearn.ensemble import BaggingRegressor, RandomForestRegressor\n",
                "from sklearn.tree import DecisionTreeRegressor\n",
                "from sklearn.neural_network import MLPRegressor"
            ]
        },
        {
            "cell_type": "markdown",
            "metadata": {},
            "source": [
                "## 1. Load Dataset\n"
            ]
        },
        {
            "cell_type": "code",
            "execution_count": None,
            "metadata": {},
            "outputs": [],
            "source": [
                "# Load dataset\n",
                "df = pd.read_csv('final_maize_climate_dataset.csv')\n",
                "display(df.head())\n",
                "\n",
                "# Define Target Output (Y)\n",
                "y = df['Maize_avg_yield']\n",
                "\n",
                "# Define the full feature set\n",
                "features = df[['Maize_sown_area', 'Maize_production', 'Tmean', 'PRCP', 'RD', 'FD', 'HD']]\n",
                "features.columns = ['AREA', 'PROD', 'Tmean', 'PRCP', 'RD', 'FD', 'HD']"
            ]
        },
        {
            "cell_type": "markdown",
            "metadata": {},
            "source": [
                "## 2. Scenarios\n",
                "- **SC1**: AREA+PROD+Tmean+PRCP+RD+FD+HD\n",
                "- **SC2**: AREA+PROD\n",
                "- **SC3**: Tmean+PRCP+RD+FD+HD\n",
                "- **SC4**: AREA+PROD+Tmean+PRCP"
            ]
        },
        {
            "cell_type": "code",
            "execution_count": None,
            "metadata": {},
            "outputs": [],
            "source": [
                "scenarios = {\n",
                "    'SC1': ['AREA', 'PROD', 'Tmean', 'PRCP', 'RD', 'FD', 'HD'],\n",
                "    'SC2': ['AREA', 'PROD'],\n",
                "    'SC3': ['Tmean', 'PRCP', 'RD', 'FD', 'HD'],\n",
                "    'SC4': ['AREA', 'PROD', 'Tmean', 'PRCP']\n",
                "}"
            ]
        },
        {
            "cell_type": "markdown",
            "metadata": {},
            "source": [
                "## 3. Evaluation Metrics"
            ]
        },
        {
            "cell_type": "code",
            "execution_count": None,
            "metadata": {},
            "outputs": [],
            "source": [
                "def calculate_metrics(y_true, y_pred):\n",
                "    y_true = np.array(y_true)\n",
                "    y_pred = np.array(y_pred)\n",
                "    \n",
                "    r = np.corrcoef(y_true, y_pred)[0, 1]\n",
                "    mae = mean_absolute_error(y_true, y_pred)\n",
                "    rmse = np.sqrt(mean_squared_error(y_true, y_pred))\n",
                "    \n",
                "    y_mean = np.mean(y_true)\n",
                "    rae = (np.sum(np.abs(y_pred - y_true)) / np.sum(np.abs(y_mean - y_true))) * 100\n",
                "    rrse = np.sqrt(np.sum((y_pred - y_true)**2) / np.sum((y_mean - y_true)**2)) * 100\n",
                "    \n",
                "    return {'r': r, 'MAE': mae, 'RMSE': rmse, 'RAE': rae, 'RRSE': rrse}"
            ]
        },
        {
            "cell_type": "markdown",
            "metadata": {},
            "source": [
                "## 4. Models\n"
            ]
        },
        {
            "cell_type": "code",
            "execution_count": None,
            "metadata": {},
            "outputs": [],
            "source": [
                "def get_models():\n",
                "    return {\n",
                "        'Bagging (BG)': BaggingRegressor(estimator=DecisionTreeRegressor(), n_estimators=100, random_state=1),\n",
                "        'Decision Table (DT Proxy)': DecisionTreeRegressor(max_depth=3, random_state=1),\n",
                "        'Random Forest (RF)': RandomForestRegressor(n_estimators=100, max_depth=None, random_state=1),\n",
                "        'ANN-MLP': MLPRegressor(hidden_layer_sizes=(50,), activation='logistic', \n",
                "                                solver='lbfgs', max_iter=2000, random_state=1)\n",
                "    }"
            ]
        },
        {
            "cell_type": "markdown",
            "metadata": {},
            "source": [
                "## 5. Experiment 1: 80-20 Split\n"
            ]
        },
        {
            "cell_type": "code",
            "execution_count": None,
            "metadata": {},
            "outputs": [],
            "source": [
                "results_split = []\n",
                "\n",
                "for sc_name, sc_features in scenarios.items():\n",
                "    X = features[sc_features]\n",
                "    \n",
                "    # Scale Features & Target\n",
                "    scaler_x = StandardScaler()\n",
                "    scaler_y = StandardScaler()\n",
                "    \n",
                "    X_scaled = scaler_x.fit_transform(X)\n",
                "    y_scaled = scaler_y.fit_transform(y.values.reshape(-1, 1)).ravel()\n",
                "    \n",
                "    X_train, X_test, y_train, y_test = train_test_split(X_scaled, y_scaled, test_size=0.20, random_state=1)\n",
                "    \n",
                "    models = get_models()\n",
                "    for model_name, model in models.items():\n",
                "        model.fit(X_train, y_train)\n",
                "        y_pred_scaled = model.predict(X_test)\n",
                "        \n",
                "        # Inverse scale back to true yield domains for true error calculation\n",
                "        y_test_inv = scaler_y.inverse_transform(y_test.reshape(-1, 1)).ravel()\n",
                "        y_pred_inv = scaler_y.inverse_transform(y_pred_scaled.reshape(-1, 1)).ravel()\n",
                "        \n",
                "        metrics = calculate_metrics(y_test_inv, y_pred_inv)\n",
                "        metrics['Scenario'] = sc_name\n",
                "        metrics['Model'] = model_name\n",
                "        metrics['Phase'] = 'Testing (80-20)'\n",
                "        results_split.append(metrics)\n",
                "\n",
                "df_results_split = pd.DataFrame(results_split)\n",
                "df_results_split = df_results_split[['Phase', 'Scenario', 'Model', 'r', 'MAE', 'RMSE', 'RAE', 'RRSE']]\n",
                "display(df_results_split)"
            ]
        },
        {
            "cell_type": "markdown",
            "metadata": {},
            "source": [
                "## 6. Experiment 2: 10-Fold CV\n"
            ]
        },
        {
            "cell_type": "code",
            "execution_count": None,
            "metadata": {},
            "outputs": [],
            "source": [
                "results_cv = []\n",
                "kf = KFold(n_splits=10, shuffle=True, random_state=1)\n",
                "\n",
                "for sc_name, sc_features in scenarios.items():\n",
                "    X = features[sc_features]\n",
                "    scaler_x = StandardScaler()\n",
                "    scaler_y = StandardScaler()\n",
                "    \n",
                "    X_scaled = scaler_x.fit_transform(X)\n",
                "    y_scaled = scaler_y.fit_transform(y.values.reshape(-1, 1)).ravel()\n",
                "    \n",
                "    models = get_models()\n",
                "    for model_name, model in models.items():\n",
                "        cv_preds = np.zeros_like(y_scaled)\n",
                "        \n",
                "        for train_idx, test_idx in kf.split(X_scaled):\n",
                "            X_train, X_test = X_scaled[train_idx], X_scaled[test_idx]\n",
                "            y_train = y_scaled[train_idx]\n",
                "            model.fit(X_train, y_train)\n",
                "            cv_preds[test_idx] = model.predict(X_test)\n",
                "            \n",
                "        # Inverse scale\n",
                "        y_true_inv = scaler_y.inverse_transform(y_scaled.reshape(-1, 1)).ravel()\n",
                "        cv_preds_inv = scaler_y.inverse_transform(cv_preds.reshape(-1, 1)).ravel()\n",
                "        \n",
                "        metrics = calculate_metrics(y_true_inv, cv_preds_inv)\n",
                "        metrics['Scenario'] = sc_name\n",
                "        metrics['Model'] = model_name\n",
                "        metrics['Phase'] = '10-Fold CV'\n",
                "        results_cv.append(metrics)\n",
                "\n",
                "df_results_cv = pd.DataFrame(results_cv)\n",
                "df_results_cv = df_results_cv[['Phase', 'Scenario', 'Model', 'r', 'MAE', 'RMSE', 'RAE', 'RRSE']]\n",
                "display(df_results_cv)"
            ]
        }
    ],
    "metadata": {
        "kernelspec": {
            "display_name": "Python 3",
            "language": "python",
            "name": "python3"
        },
        "language_info": {
            "name": "python",
            "version": "3.8"
        }
    },
    "nbformat": 4,
    "nbformat_minor": 4
}

with open('/home/ashi/Documents/Data_mining/Maize_Yield_Prediction.ipynb', 'w') as f:
    json.dump(notebook, f, indent=2)

print("Notebook Re-Generated with new parameters successfully!")
