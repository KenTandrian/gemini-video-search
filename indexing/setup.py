import logging
from google.api_core.client_options import ClientOptions
from google.api_core import exceptions
from google.cloud import discoveryengine_v1 as discoveryengine

# Internal modules
import config

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_datastore():
    """
    Creates a Vertex AI Search Data Store if it doesn't already exist.
    """
    # Create a client
    client_options = ClientOptions(
        api_endpoint=f"{config.REGION}-discoveryengine.googleapis.com"
    )
    client = discoveryengine.DataStoreServiceClient(client_options=client_options)

    # The full resource name of the parent collection
    parent = client.collection_path(
        config.PROJECT_ID,
        config.REGION,
        "default_collection"
    )
    
    # Construct the Data Store object
    data_store = discoveryengine.DataStore(
        display_name="Video Search Datastore",
        industry_vertical="GENERIC",
        solution_types=["SOLUTION_TYPE_SEARCH"],
        content_config=discoveryengine.DataStore.ContentConfig.CONTENT_REQUIRED,
    )

    # Construct the request
    request = discoveryengine.CreateDataStoreRequest(
        parent=parent,
        data_store=data_store,
        data_store_id=config.DATA_STORE_ID,
    )

    try:
        logger.info(f"Attempting to create Data Store with ID: {config.DATA_STORE_ID}...")
        operation = client.create_data_store(request=request)
        logger.info("Waiting for Data Store creation to complete...")
        response = operation.result()
        logger.info(f"Successfully created Data Store: {response}")
        
    except exceptions.AlreadyExists:
        logger.info(f"Data Store '{config.DATA_STORE_ID}' already exists. No action needed.")
    except Exception as e:
        logger.error(f"An error occurred during Data Store creation: {e}")
        raise

if __name__ == '__main__':
    print("--- Setting up Google Cloud Resources for the project ---")
    create_datastore()
    print("\n--- Resource setup complete ---")
    print("You can now run the main data pipeline.")
