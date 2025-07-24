from flask_restful import Resource, reqparse
from flask import request
from models import db, Note

# Request parser for POST and PUT
note_parser = reqparse.RequestParser()
note_parser.add_argument('content', type=str, required=True, help="Content cannot be blank.")

# 🔹 /notes → List all or create new
class NoteListResource(Resource):
    def get(self):
        # Optional ?q=keyword search
        keyword = request.args.get('q', '')
        if keyword:
            notes = Note.query.filter(Note.content.ilike(f'%{keyword}%')).order_by(Note.timestamp.desc()).all()
        else:
            notes = Note.query.order_by(Note.timestamp.desc()).all()

        return [
            {
                'id': note.id,
                'content': note.content,
                'timestamp': note.timestamp.strftime('%Y-%m-%d %H:%M:%S')
            }
            for note in notes
        ]

    def post(self):
        args = note_parser.parse_args()
        new_note = Note(content=args['content'])
        db.session.add(new_note)
        db.session.commit()

        return {
            'message': 'Note created successfully.',
            'note': {
                'id': new_note.id,
                'content': new_note.content,
                'timestamp': new_note.timestamp.strftime('%Y-%m-%d %H:%M:%S')
            }
        }, 201

# 🔹 /notes/<id> → Edit or delete
class NoteResource(Resource):
    def put(self, note_id):
        note = Note.query.get_or_404(note_id)
        args = note_parser.parse_args()
        note.content = args['content']
        db.session.commit()

        return {
            'message': 'Note updated.',
            'note': {
                'id': note.id,
                'content': note.content,
                'timestamp': note.timestamp.strftime('%Y-%m-%d %H:%M:%S')
            }
        }

    def delete(self, note_id):
        note = Note.query.get_or_404(note_id)
        db.session.delete(note)
        db.session.commit()

        return { 'message': 'Note deleted successfully.' }

class NoteSearchResource(Resource):
    def get(self):
        query = request.args.get('q', '').strip()
        if not query:
            return {"message": "Query parameter 'q' is required."}, 400

        results = Note.query.filter(Note.content.ilike(f"%{query}%")).order_by(Note.timestamp.desc()).all()

        return [
            {
                'id': note.id,
                'content': note.content,
                'timestamp': note.timestamp.strftime('%Y-%m-%d %H:%M:%S')
            }
            for note in results
        ], 200
