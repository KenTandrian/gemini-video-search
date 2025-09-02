from flask import Flask, render_template, request, jsonify
import os
from google.api_core.client_options import ClientOptions
from google.cloud import discoveryengine_v1 as discoveryengine
from config import config

def create_app(config_name=None):
    """Application factory pattern"""
    app = Flask(__name__)
    
    # Load configuration
    config_name = config_name or os.environ.get('FLASK_ENV', 'default')
    app.config.from_object(config[config_name])
    
    return app

app = create_app()

def search_sample(search_query: str):
    """Search for media using Vertex AI Discovery Engine"""
    try:
        # Get configuration
        project_id = app.config['GOOGLE_CLOUD_PROJECT']
        location = app.config['VERTEX_AI_LOCATION']
        engine_id = app.config['VERTEX_AI_ENGINE_ID']
        
        client_options = (
            ClientOptions(api_endpoint=f"{location}-discoveryengine.googleapis.com")
            if location != "global"
            else None
        )

        # Create a client
        client = discoveryengine.SearchServiceClient(client_options=client_options)

        # The full resource name of the search app serving config
        serving_config = f"projects/{project_id}/locations/{location}/collections/default_collection/engines/{engine_id}/servingConfigs/default_config"

        # Configuration options for search
        content_search_spec = discoveryengine.SearchRequest.ContentSearchSpec(
            snippet_spec=discoveryengine.SearchRequest.ContentSearchSpec.SnippetSpec(
                return_snippet=True
            ),
            summary_spec=discoveryengine.SearchRequest.ContentSearchSpec.SummarySpec(
                summary_result_count=5,
                include_citations=True,
                ignore_adversarial_query=True,
                ignore_non_summary_seeking_query=True,
                model_prompt_spec=discoveryengine.SearchRequest.ContentSearchSpec.SummarySpec.ModelPromptSpec(
                    preamble="Provide a brief summary of the video content."
                ),
                model_spec=discoveryengine.SearchRequest.ContentSearchSpec.SummarySpec.ModelSpec(
                    version="stable",
                ),
            ),
        )

        # Create search request
        request = discoveryengine.SearchRequest(
            serving_config=serving_config,
            query=search_query,
            page_size=app.config.get('DEFAULT_PAGE_SIZE', 10),
            content_search_spec=content_search_spec,
            query_expansion_spec=discoveryengine.SearchRequest.QueryExpansionSpec(
                condition=discoveryengine.SearchRequest.QueryExpansionSpec.Condition.AUTO,
            ),
            spell_correction_spec=discoveryengine.SearchRequest.SpellCorrectionSpec(
                mode=discoveryengine.SearchRequest.SpellCorrectionSpec.Mode.AUTO
            ),
        )

        page_result = client.search(request)
        
        # Process results
        results = []
        summary = None
        
        app.logger.info(f"Search query: {search_query}")
        app.logger.info(f"Total results available: {page_result.total_size}")
        app.logger.info(f"Results in this page: {len(page_result.results)}")
        
        # Extract summary if available
        if hasattr(page_result, 'summary') and page_result.summary:
            summary = page_result.summary.summary_text
            app.logger.info(f"Found summary: {summary}")
        
        # Process only the results in this page (correctly limited by page_size)
        for result in page_result.results:
            app.logger.info(f"Processing result: {type(result)}")
            
            # Each result has a document
            if hasattr(result, 'document'):
                document = result.document
                result_data = {
                    'id': document.id if hasattr(document, 'id') else 'unknown',
                    'title': 'Untitled Video',
                    'snippet': '',
                    'uri': '',
                    'thumbnail': ''
                }
                
                # Extract data from struct_data
                if hasattr(document, 'struct_data') and document.struct_data:
                    struct_data = dict(document.struct_data)
                    app.logger.info(f"Struct data keys: {list(struct_data.keys())}")
                    
                    # Extract title from various possible fields
                    result_data['title'] = (
                        struct_data.get('video_title', '') or 
                        struct_data.get('title', '') or 
                        struct_data.get('name', '') or 
                        'Untitled Video'
                    )
                    
                    # Extract video source/URI
                    result_data['uri'] = (
                        struct_data.get('video_src', '') or 
                        struct_data.get('uri', '') or 
                        struct_data.get('url', '') or
                        struct_data.get('link', '')
                    )
                    
                    # Extract description/snippet
                    result_data['snippet'] = (
                        struct_data.get('video_desc', '') or
                        struct_data.get('document_description', '') or
                        struct_data.get('description', '') or
                        struct_data.get('snippet', '') or
                        struct_data.get('document_transcript', '') or
                        ''
                    )
                    
                    # For thumbnails, check if we have direct thumbnail data
                    # Skip generating protected URLs for now - use placeholders
                    result_data['thumbnail'] = ''  # Let the frontend handle placeholders
                
                # Also check derived_struct_data for additional info
                if hasattr(document, 'derived_struct_data') and document.derived_struct_data:
                    derived_data = dict(document.derived_struct_data)
                    app.logger.info(f"Derived data keys: {list(derived_data.keys())}")
                    
                    # Extract snippets if available
                    if 'snippets' in derived_data and not result_data['snippet']:
                        snippets_list = derived_data['snippets']
                        if hasattr(snippets_list, 'list_value') and snippets_list.list_value.values:
                            for snippet_item in snippets_list.list_value.values:
                                if hasattr(snippet_item, 'struct_value'):
                                    snippet_struct = dict(snippet_item.struct_value.fields)
                                    if 'snippet' in snippet_struct:
                                        snippet_text = snippet_struct['snippet'].string_value
                                        if snippet_text != "No snippet is available for this page.":
                                            result_data['snippet'] = snippet_text
                                            break
                
                app.logger.info(f"Final result data: {result_data}")
                results.append(result_data)
        
        app.logger.info(f"Total results processed: {len(results)}")
        
        return {
            'results': results,
            'summary': summary,
            'total_results': page_result.total_size,  # Use total available, not just current page
            'page_results': len(results)  # Results in current page
        }
        
    except Exception as e:
        app.logger.error(f"Search error: {str(e)}")
        import traceback
        app.logger.error(f"Traceback: {traceback.format_exc()}")
        return {
            'results': [],
            'summary': None,
            'total_results': 0,
            'error': str(e)
        }

@app.route('/')
def index():
    """Home page with search interface"""
    return render_template('index.html')

@app.route('/search')
def search():
    """Search endpoint"""
    query = request.args.get('q', '').strip()
    
    if not query:
        return render_template('index.html', error="Please enter a search query")
    
    # Perform search
    search_results = search_sample(query)
    
    return render_template('results.html', 
                         query=query,
                         results=search_results['results'],
                         summary=search_results.get('summary'),
                         total_results=search_results['total_results'],
                         error=search_results.get('error'))

@app.route('/api/search')
def api_search():
    """API endpoint for search"""
    query = request.args.get('q', '').strip()
    
    if not query:
        return jsonify({'error': 'Query parameter required'}), 400
    
    search_results = search_sample(query)
    return jsonify(search_results)

@app.route('/health')
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'version': '1.0.0',
        'config_valid': app.config.get('GOOGLE_CLOUD_PROJECT') is not None
    })

if __name__ == '__main__':
    # Get port from environment variable (Cloud Run sets PORT)
    port = int(os.environ.get('PORT', 3000))
    app.run(debug=app.config['DEBUG'], host='0.0.0.0', port=port) 