from flask import Flask
from flask_restful import Api
from config import Config
from models import db
from resources.note import NoteListResource, NoteResource , NoteSearchResource

app = Flask(__name__)
app.config.from_object(Config)

# Initialize extensions
db.init_app(app)
api = Api(app)

# Register routes
api.add_resource(NoteListResource, '/notes')
api.add_resource(NoteResource, '/notes/<int:note_id>')
api.add_resource(NoteSearchResource, '/notes/search')

# ✅ Create tables explicitly for Flask 3.x
if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)
