from flask import Flask
from flask_restful import Api
from config import Config
from models import db
from resources.note import NoteListResource, NoteResource , NoteSearchResource
# app.py (or wherever your Flask app is defined)
from flask import Flask, render_template


app = Flask(__name__)
app.config.from_object(Config)

# Initialize extensions
db.init_app(app)
api = Api(app)

# Register routes
api.add_resource(NoteListResource, '/notes')
api.add_resource(NoteResource, '/notes/<int:note_id>')
api.add_resource(NoteSearchResource, '/notes/search')

# At the end of your app setup:
@app.route('/')
def home():
    return render_template('index.html')

# ✅ Create tables explicitly for Flask 3.x
if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)
