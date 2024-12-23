from flask import Flask, render_template, send_from_directory
import logging
import os

# Configure logging
logging.basicConfig(level=logging.DEBUG)

app = Flask(__name__)


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/static/js/<path:filename>')
def serve_js(filename):
    return send_from_directory('static/js', filename)


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
