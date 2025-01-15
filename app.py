import os
from flask import Flask, render_template, request, jsonify
import pandas as pd
from collections import defaultdict

app = Flask(__name__, static_folder='static')

HOME_DIR = os.getcwd()

def load_questions_from_excel(file_path):
    data = pd.ExcelFile(file_path)
    input_sheet = data.parse('Input')
    input_sheet.columns = input_sheet.iloc[0]  # Set the first row as the column header
    input_sheet = input_sheet[1:].reset_index(drop=True)  # Remove the header row and reset index
    input_sheet = input_sheet.ffill()  # Forward-fill 'Group Name'
    
    # Remove duplicate questions within groups
    input_sheet = input_sheet.drop_duplicates(subset=['Group Name', 'Security Controls'])

    grouped_data = input_sheet.groupby('Group Name').apply(
        lambda group: {
            "questions": group[['Security Controls', 'Answers', 'Weight']].to_dict(orient="records")
        }
    ).to_dict()

    return grouped_data


   # return grouped_data

# Initialize data from the Excel file
questions_file = os.path.join(HOME_DIR, "Security Score Card.xlsx")
groups_data = load_questions_from_excel(questions_file)

@app.route('/')
def index():
    return render_template("index.html", groups=groups_data)

@app.route('/submit', methods=['POST'])
def submit():
    data = request.json
    group_scores = defaultdict(int)

    for group_name, group in groups_data.items():
        total_group_weight = sum(float(q['Weight']) for q in group["questions"])  # Calculate dynamically
        for question in group["questions"]:
            question_id = question['Security Controls']
            if data.get(question_id) == "Yes":
                group_scores[group_name] += float(question['Weight'])

        # Normalize scores for the group
        group_scores[group_name] = (group_scores[group_name] / total_group_weight) * 100 if total_group_weight > 0 else 0

    return jsonify(group_scores)

if __name__ == '__main__':
    app.run(debug=True)
