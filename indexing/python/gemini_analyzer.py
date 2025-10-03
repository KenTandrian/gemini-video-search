import logging
import json
import time
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

def get_video_type(gcs_uri: str) -> str:
    """
    Determines the type of video ("sports" or "soap_opera").
    """
    logger.info(f"Determining video type for: {gcs_uri}...")
    prompt = """
    Analyze the video and determine if it is a "sports" or "soap_opera" video.
    Respond with a single word: "sports" or "soap_opera".
    """
    try:
        video_part = Part.from_uri(file_uri=gcs_uri, mime_type="video/mp4")
        response = client.models.generate_content(
            model=config.GEMINI_MODEL_NAME,
            contents=[prompt, video_part],
        )
        video_type = response.text.strip().lower() if response.text else "unknown"
        logger.info(f"Video type for {gcs_uri} is: {video_type}")
        return video_type
    except Exception as e:
        logger.error(f"Failed to determine video type for {gcs_uri}. Error: {e}")
        return "unknown"

def generate_global_context(gcs_uri: str, video_type: str) -> dict:
    """
    Performs a preliminary analysis of the entire video to extract global context.
    """
    logger.info(f"Generating global context for video: {gcs_uri}...")

    if video_type == "sports":
        prompt = """
        <INSTRUCTIONS>
        Analyze this entire sports video to identify the two playing teams and their player rosters.
        Respond in a structured JSON format with a single field: "teams".
        - "teams": A list of two JSON objects, each representing a team. Each team object should have the following fields:
            - "name": The full name of the team.
            - "short_name": The abbreviated name of the team (e.g., "PBY" for "Persebaya Surabaya").
            - "jersey_color": The primary color of the team's jersey.
            - "players": A list of JSON objects, each representing a player on the team. Each player object should have:
                - "name": The name of the player.
                - "jersey_number": The player's jersey number.
        </INSTRUCTIONS>
        """
    elif video_type == "soap_opera":
        prompt = """
        <INSTRUCTIONS>
        You are an expert video content analyzer specializing in Indonesian soap operas.
        Analyze this entire video to identify all characters.
        Respond in a structured JSON format with a single field: "characters".
        - "characters": A list of JSON objects, each representing a character. Each character object should have the following fields:
            - "name": The name of the character.
            - "role": The role or relationship of the character in the story.
        </INSTRUCTIONS>
        """
    else:
        return {}

    try:
        start = time.time()
        video_part = Part.from_uri(file_uri=gcs_uri, mime_type="video/mp4")
        response = client.models.generate_content(
            model=config.GEMINI_MODEL_NAME,
            contents=[prompt, video_part],
            config=GenerateContentConfig(
                response_mime_type="application/json"
            ),
        )
        cleaned_response = response.text.strip().replace("```json", "").replace("```", "") if response.text else ""
        context_data = json.loads(cleaned_response)
        dur = time.time() - start
        logger.info(f"Generated global context for {gcs_uri}: {context_data} in {dur}s")
        return context_data

    except (Exception, json.JSONDecodeError) as e:
        logger.error(f"Failed to generate global context for {gcs_uri}. Error: {e}")
        return {}

def generate_video_analysis(gcs_uri: str, global_context: dict, video_type: str) -> dict:
    """
    Analyzes a video segment using Gemini and generates a structured JSON object.
    """
    logger.info(f"Analyzing video: {gcs_uri} with model {config.GEMINI_MODEL_NAME}...")
    start = time.time()

    context_prompt = ""
    if global_context:
        if video_type == "sports":
            context_prompt = f"""
            Use the following global context to identify the entities in this clip:
            - Teams: {json.dumps(global_context.get("teams", []))}
            """
        elif video_type == "soap_opera":
            context_prompt = f"""
            Use the following global context to identify the entities in this clip:
            - Characters: {json.dumps(global_context.get("characters", []))}
            """

    if video_type == "sports":
        prompt = f"""
        <INSTRUCTIONS>
        Analyze this sports video clip with high detail. Respond in a single structured JSON format.
        The JSON object should contain the following fields:
        - "description": A complete, single-paragraph description in English focusing on the key actions.
        - "persons": A list of JSON objects, each with a "name" and a "role". The role must be one of the following supported values: "director", "actor", "player", "team", "league", "editor", "author", "character", "contributor", "creator", "editor", "funder", "producer", "provider", "publisher", "sponsor", "translator", "music-by", "channel". For athletes, use the "player" role.
        - "organizations": A list of JSON objects, each with a "name" and a "role". The role must be one of the following supported values: "director", "actor", "player", "team", "league", "editor", "author", "character", "contributor", "creator", "editor", "funder", "producer", "provider", "publisher", "sponsor", "translator", "music-by", "channel". For sports teams, use the "team" role.
        - "hash_tags": A list of relevant hashtags in PascalCase that describe the action (e.g., "#LongShot", "#Screamer", "#Rebound", "#BlockedShot"). Do not include player names, team names, or generic terms like "#Soccer" or "#Football".

        Focus only on the events in the video.
        </INSTRUCTIONS>

        <CONTEXT>
        {context_prompt}
        </CONTEXT>
        """
    elif video_type == "soap_opera":
        prompt = f"""
        <INSTRUCTIONS>
        Analyze this soap opera video clip with high detail. Respond in a single structured JSON format.
        The JSON object should contain the following fields:
        - "description": A complete and detailed description in English that includes all dialogue, actions, and events from the scene, capturing the emotional tone of the interactions.
        - "persons": A list of JSON objects for each character, with a "name" and a "role". The role should be "character".
        - "organizations": Leave this field as an empty list.
        - "hash_tags": A list of relevant hashtags in PascalCase that describe the scene's themes or key events (e.g., "#Betrayal", "#FamilyDrama", "#SecretRevealed"). Do not include character names.

        Focus only on the events in the video.
        </INSTRUCTIONS>

        <CONTEXT>
        {context_prompt}
        </CONTEXT>
        """
    else:
        return {}

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
        
        dur = time.time() - start
        logger.info(f"Generated analysis for {gcs_uri}: {analysis_data} in {dur}s")
        return analysis_data

    except (Exception, json.JSONDecodeError) as e:
        logger.error(f"Failed to generate or parse analysis for {gcs_uri}. Error: {e}")
        return {}
