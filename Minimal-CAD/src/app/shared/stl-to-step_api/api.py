from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
import subprocess
import os
import logging

# TODO: deploy the API to firebase or cloud run and update the URL in the frontend

app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.ERROR)
ALLOWED_EXTENSIONS = {"stl"}
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_FILE = os.path.join(BASE_DIR, "model.stl")
OUTPUT_FILE = os.path.join(BASE_DIR, "output.step")
CONVERTER_SCRIPT = os.path.join(BASE_DIR, "convert_stl_to_step.py")


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route("/uploadStlToServer", methods=["POST"])
def upload_stl():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file part in the request'}), 400

        file = request.files['file']

        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400

        if file and allowed_file(file.filename):
            filename = "model.stl"
            filepath = MODEL_FILE
            with open(filepath, "wb") as f:
                f.write(file.read())

            return jsonify({
                'message': 'File uploaded successfully',
                'filename': filename,
                'filepath': filepath
            }), 200
        else:
            return jsonify({'error': 'Invalid file type. Only .stl files are allowed'}), 400

    except Exception:
        logging.exception("Unexpected error during STL upload")
        return jsonify({"error": "An internal error has occurred."}), 500


@app.route("/convert", methods=["GET"])
def convert():
    try:
        result = subprocess.run(
            ["FreeCADCmd", CONVERTER_SCRIPT],
            capture_output=True,
            text=True,
            timeout=60,
            cwd=BASE_DIR,
        )

        return jsonify({
            'returncode': result.returncode,
            'stdout': result.stdout,
            'stderr': result.stderr
        })

    except subprocess.TimeoutExpired:
        return jsonify({"error": "Command timed out"}), 500
    except Exception:
        logging.exception("Unexpected error during STL to STEP conversion")
        return jsonify({"error": "An internal error has occurred."}), 500


@app.route("/download", methods=["GET"])
def download_step():
    try:
        step_file_path = os.path.join('.', 'output.step')

        if not os.path.exists(step_file_path):
            return jsonify({'error': 'output.step file not found'}), 404

        return send_file(
            step_file_path,
            as_attachment=True,
            download_name="output.step",
            mimetype="application/step",
        )

    except Exception as e:
        logging.exception("Unexpected error in /download endpoint")
        return (
            jsonify(
                {
                    "error": "An internal error occurred while processing the download request"
                }
            ),
            500,
        )


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
