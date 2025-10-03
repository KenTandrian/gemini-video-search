import logging
from google.api_core.client_options import ClientOptions
from google.cloud import discoveryengine

# Internal modules
import config

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def import_documents_from_gcs(gcs_uri: str):
    """
    Triggers the document import process in Vertex AI Search.
    """
    client_options = ClientOptions(
        api_endpoint=f"{config.REGION}-discoveryengine.googleapis.com"
    )
    client = discoveryengine.DocumentServiceClient(client_options=client_options)

    parent = client.branch_path(
        project=config.PROJECT_ID,
        location=config.REGION,
        data_store=config.DATA_STORE_ID,
        branch="default_branch",
    )

    request = discoveryengine.ImportDocumentsRequest(
        parent=parent,
        gcs_source=discoveryengine.GcsSource(input_uris=[gcs_uri]),
        reconciliation_mode=discoveryengine.ImportDocumentsRequest.ReconciliationMode.INCREMENTAL,
    )

    try:
        operation = client.import_documents(request=request)
        logger.info(f"Started document import operation: {operation.operation.name}")
        logger.info(
            "You can monitor the import progress in the Google Cloud Console under Vertex AI Search."
        )
    except Exception as e:
        logger.error(f"Failed to start document import. Error: {e}")
        raise
