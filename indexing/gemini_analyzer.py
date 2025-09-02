import logging
from google import genai
from google.genai.types import Part

# Internal modules
import config

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

try:
    client = genai.Client(project=config.PROJECT_ID, location=config.REGION, vertexai=True)
    logger.info("Vertex AI initialized successfully.")
except Exception as e:
    logger.error(f"Error initializing Vertex AI: {e}")
    
def generate_video_description(gcs_uri: str) -> str:
    """
    Analyzes a video segment using Gemini and generates a text description.

    Returns:
        A detailed English description of the video content, or an empty string if analysis fails.
    """
    logger.info(f"Analyzing video: {gcs_uri} with model {config.GEMINI_MODEL_NAME}...")
    
    prompt = """
    Analyze this sports video clip with high detail.
    Provide a concise, single-paragraph description in English focusing on the key actions.
    Describe:
    - The main player or players involved (e.g., "AC Milan striker", "the goalkeeper").
    - The specific action taking place (e.g., "a powerful right-footed shot", "a diving save").
    - The immediate outcome of the action within this clip (e.g., "scoring a goal", "conceding a corner").
    - Avoid mentioning camera angles or generic statements like "the video shows".
    Focus only on the events in the video.
    """

    try:
        video_part = Part.from_uri(file_uri=gcs_uri, mime_type="video/mp4")
        response = client.models.generate_content(
            model=config.GEMINI_MODEL_NAME,
            contents=[prompt, video_part]
        )
        
        description = response.text.strip() if response.text else ""
        logger.info(f"Generated description for {gcs_uri}: '{description}'")
        return description

    except Exception as e:
        logger.error(f"Failed to generate description for {gcs_uri}. Error: {e}")
        return ""
