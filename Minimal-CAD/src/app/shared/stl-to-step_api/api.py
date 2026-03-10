from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
import subprocess
import os
import logging
import shutil

# TODO: deploy the API to firebase or cloud run and update the URL in the frontend

app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.ERROR)
ALLOWED_EXTENSIONS = {"stl"}
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_FILE = os.path.join(BASE_DIR, "model.stl")
OUTPUT_FILE = os.path.join(BASE_DIR, "output.step")
CONVERTER_SCRIPT = os.path.join(BASE_DIR, "convert_stl_to_step.py")


def resolve_freecad_command():
    # Allow explicit override for different runtime images.
    env_cmd = os.environ.get("FREECAD_CMD", "").strip()
    if env_cmd:
        return env_cmd

    # FreeCAD binary name differs across platforms/packages.
    candidates = [
        "FreeCADCmd",
        "freecadcmd",
        "FreeCADCmd.exe",
        "/usr/bin/FreeCADCmd",
        "/usr/bin/freecadcmd",
    ]
    for cmd in candidates:
        resolved = shutil.which(cmd) if not os.path.isabs(cmd) else (cmd if os.path.exists(cmd) else None)
        if resolved:
            return resolved
    return None


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
        if not os.path.exists(MODEL_FILE):
            return jsonify({"error": "No STL model available. Upload first via /uploadStlToServer."}), 400

        freecad_cmd = resolve_freecad_command()
        if not freecad_cmd:
            logging.error("No FreeCAD command found in runtime image")
            return jsonify({"error": "FreeCAD executable not found in runtime."}), 500

        if os.path.exists(OUTPUT_FILE):
            os.remove(OUTPUT_FILE)

        result = subprocess.run(
            [freecad_cmd, CONVERTER_SCRIPT],
            capture_output=True,
            text=True,
            timeout=60,
            cwd=BASE_DIR,
        )

        if result.returncode != 0:
            logging.error("FreeCAD conversion failed: %s", result.stderr)
            return (
                jsonify(
                    {
                        "error": "STL to STEP conversion failed.",
                        "returncode": result.returncode,
                        "stderr": result.stderr,
                    }
                ),
                500,
            )

        if not os.path.exists(OUTPUT_FILE):
            logging.error("Conversion completed but output.step was not created")
            return jsonify({"error": "Conversion finished without output.step."}), 500

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
        step_file_path = OUTPUT_FILE

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
