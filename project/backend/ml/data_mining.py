import pandas as pd
import json
from sqlalchemy.orm import Session
from sklearn.cluster import KMeans
from mlxtend.frequent_patterns import apriori, association_rules
from ml.pipeline import extract_training_data

def get_kmeans_clusters(db: Session, n_clusters=3):
    df = extract_training_data(db)
    if df.empty or len(df) < n_clusters:
        return []
    
    features = ['avg_temp', 'rainfall', 'yield_value']
    X = df[features].fillna(0)
    
    kmeans = KMeans(n_clusters=n_clusters, random_state=42)
    clusters = kmeans.fit_predict(X)
    df['cluster'] = clusters
    
    centers = kmeans.cluster_centers_
    result = []
    for i, center in enumerate(centers):
        result.append({
            "cluster_id": i,
            "avg_temp": float(center[0]),
            "rainfall": float(center[1]),
            "yield_value": float(center[2]),
            "size": int((df['cluster'] == i).sum())
        })
    return result

def get_association_rules(db: Session):
    df = extract_training_data(db)
    if df.empty:
        return []
    
    df['high_rainfall'] = df['rainfall'] > df['rainfall'].median()
    df['high_yield'] = df['yield_value'] > df['yield_value'].median()
    df['large_area'] = df['sown_area'] > df['sown_area'].median()
    df['high_temp'] = df['avg_temp'] > df['avg_temp'].median()
    
    basket = df[['high_rainfall', 'high_yield', 'large_area', 'high_temp']]
    frequent_itemsets = apriori(basket, min_support=0.1, use_colnames=True)
    if frequent_itemsets.empty:
        return []
        
    rules = association_rules(frequent_itemsets, metric="lift", min_threshold=1.0)
    
    result = []
    for _, row in rules.head(10).iterrows():
        result.append({
            "antecedents": list(row['antecedents']),
            "consequents": list(row['consequents']),
            "support": float(row['support']),
            "confidence": float(row['confidence']),
            "lift": float(row['lift'])
        })
    return result
