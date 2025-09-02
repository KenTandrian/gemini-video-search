import logging
import json
from google import genai
from google.genai.types import Part, GenerateContentConfig

# Internal modules
import config

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

try:
    client = genai.Client(project=config.PROJECT_ID, location=config.REGION, vertexai=True)
    logger.info("Vertex AI initialized successfully.")
except Exception as e:
    logger.error(f"Error initializing Vertex AI: {e}")

def generate_video_analysis(gcs_uri: str) -> dict:
    """
    Analyzes a video segment using Gemini and generates a structured JSON object.

    Returns:
        A dictionary containing the description, persons, organizations, and hashtags,
        or an empty dictionary if analysis fails.
    """
    logger.info(f"Analyzing video: {gcs_uri} with model {config.GEMINI_MODEL_NAME}...")

    prompt = """
    Analyze this sports video clip with high detail. Respond in a structured JSON format.
    The JSON object should contain the following fields:
    - "description": A complete, single-paragraph description in English focusing on the key actions.
    - "persons": A list of JSON objects, each with a "name" (e.g., "Lionel Messi", "the goalkeeper") and a "role". The role must be one of the following supported values: "director", "actor", "player", "team", "league", "editor", "author", "character", "contributor", "creator", "editor", "funder", "producer", "provider", "publisher", "sponsor", "translator", "music-by", "channel". For athletes, use the "player" role.
    - "organizations": A list of JSON objects, each with a "name" (e.g., "FC Barcelona", "AC Milan") and a "role". The role must be one of the following supported values: "director", "actor", "player", "team", "league", "editor", "author", "character", "contributor", "creator", "editor", "funder", "producer", "provider", "publisher", "sponsor", "translator", "music-by", "channel". For sports teams, use the "team" role.
    - "hash_tags": A list of relevant hashtags (e.g., "#goal", "#soccer").

    Focus only on the events in the video.
    """

    try:
        video_part = Part.from_uri(file_uri=gcs_uri, mime_type="video/mp4")
        response = client.models.generate_content(
            model=config.GEMINI_MODEL_NAME,
            contents=[prompt, video_part],
            config=GenerateContentConfig(
                response_mime_type="application/json"
            )
        )

        # Clean the response and load as JSON
        cleaned_response = response.text.strip().replace("```json", "").replace("```", "") if response.text else ""
        analysis_data = json.loads(cleaned_response)
        
        logger.info(f"Generated analysis for {gcs_uri}: {analysis_data}")
        return analysis_data

    except (Exception, json.JSONDecodeError) as e:
        logger.error(f"Failed to generate or parse analysis for {gcs_uri}. Error: {e}")
        return {}
