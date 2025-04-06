"""
Google Search API Demonstration
==============================

This module demonstrates comprehensive usage of the Google Custom Search JSON API.
It includes initialization, core search functionality, specialized filtering examples,
response parsing, pagination, error handling, and rate limiting considerations.

For production use, replace placeholder values with your actual API credentials.
"""

import os
import time
import json
import requests
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Union, Tuple
from urllib.parse import urlencode

# ============================================================================
# CUSTOM EXCEPTIONS
# ============================================================================

class GoogleSearchError(Exception):
    """Base exception class for Google Search API errors."""
    pass

class RateLimitExceededError(GoogleSearchError):
    """Exception raised when API rate limits are exceeded."""
    pass

# ============================================================================
# INITIALIZATION
# ============================================================================

class GoogleSearchAPI:
    """
    Google Custom Search API client for performing web searches.
    
    This class provides a comprehensive interface to the Google Custom Search JSON API,
    allowing for advanced search capabilities, filtering, and result processing.
    
    API Documentation: https://developers.google.com/custom-search/v1/overview
    """
    
    # Base URL for the Google Custom Search API
    BASE_URL = "https://www.googleapis.com/customsearch/v1"
    
    # Default request timeout in seconds
    DEFAULT_TIMEOUT = 30
    
    # Rate limiting constants
    DEFAULT_REQUESTS_PER_DAY = 100  # Free tier limit
    DEFAULT_REQUESTS_PER_SECOND = 10  # Reasonable limit to avoid overloading
    
    def __init__(
        self, 
        api_key: str = None, 
        search_engine_id: str = None,
        timeout: int = DEFAULT_TIMEOUT,
        max_retries: int = 3,
        retry_delay: int = 2,
        requests_per_day: int = DEFAULT_REQUESTS_PER_DAY,
        requests_per_second: int = DEFAULT_REQUESTS_PER_SECOND
    ):
        """
        Initialize the Google Search API client.
        
        Args:
            api_key: Your Google API key. If None, will look for GOOGLE_API_KEY environment variable.
            search_engine_id: Your Custom Search Engine ID. If None, will look for GOOGLE_CSE_ID environment variable.
            timeout: Request timeout in seconds.
            max_retries: Maximum number of retries for failed requests.
            retry_delay: Delay between retries in seconds.
            requests_per_day: Maximum requests allowed per day.
            requests_per_second: Maximum requests allowed per second.
        """
        # Get API credentials from parameters or environment variables
        self.api_key = api_key or os.environ.get("GOOGLE_API_KEY", "YOUR_API_KEY_HERE")
        self.search_engine_id = search_engine_id or os.environ.get("GOOGLE_CSE_ID", "YOUR_SEARCH_ENGINE_ID_HERE")
        
        # Validate credentials
        if self.api_key == "YOUR_API_KEY_HERE":
            print("WARNING: Using placeholder API key. Set GOOGLE_API_KEY environment variable or pass api_key parameter.")
        
        if self.search_engine_id == "YOUR_SEARCH_ENGINE_ID_HERE":
            print("WARNING: Using placeholder Search Engine ID. Set GOOGLE_CSE_ID environment variable or pass search_engine_id parameter.")
        
        # Request configuration
        self.timeout = timeout
        self.max_retries = max_retries
        self.retry_delay = retry_delay
        
        # Rate limiting configuration
        self.requests_per_day = requests_per_day
        self.requests_per_second = requests_per_second
        
        # Rate limiting state
        self.request_timestamps = []
        self.daily_request_count = 0
        self.daily_reset_time = datetime.now() + timedelta(days=1)

    # ============================================================================
    # CORE SEARCH FUNCTIONALITY
    # ============================================================================
    
    def search(
        self,
        query: str,
        start: int = 1,
        num: int = 10,
        search_type: Optional[str] = None,
        fields: Optional[str] = None,
        sort: Optional[str] = None,
        safe: str = "off",
        cx: Optional[str] = None,
        gl: Optional[str] = None,  # Geolocation parameter
        cr: Optional[str] = None,  # Country restrict
        lr: Optional[str] = None,  # Language restrict
        rights: Optional[str] = None,  # Rights filtering
        filter: str = "0",  # Duplicate content filter
        date_restrict: Optional[str] = None,
        exact_terms: Optional[str] = None,
        exclude_terms: Optional[str] = None,
        file_type: Optional[str] = None,
        site_search: Optional[str] = None,
        site_search_filter: Optional[str] = None,
        link_site: Optional[str] = None,
        or_terms: Optional[str] = None,
        related_site: Optional[str] = None,
        **additional_params
    ) -> Dict[str, Any]:
        """
        Perform a Google search with the specified parameters.
        
        Args:
            query: Search query string.
            start: Index of first result to return (1-based indexing).
            num: Number of results to return (max 10).
            search_type: Type of search to perform. Options: 'image'.
            fields: Selector specifying which fields to include in a partial response.
            sort: Sort order for results. Format: "date:r:YYYYMMDD:YYYYMMDD" or "date:d:s"
            safe: Safety level. Options: 'off', 'medium', 'high'.
            cx: Custom Search Engine ID (overrides the one set during initialization).
            gl: Geolocation of end user (ISO 3166-1 alpha-2 country code).
            cr: Country restriction (e.g., 'countryUS').
            lr: Language restriction (e.g., 'lang_en').
            rights: Rights filtering (e.g., 'cc_publicdomain').
            filter: Duplicate content filter. '0' (off) or '1' (on).
            date_restrict: Date restriction (e.g., 'd[number]', 'w[number]', 'm[number]', 'y[number]').
            exact_terms: Exact terms to include in results.
            exclude_terms: Terms to exclude from results.
            file_type: File type to restrict results to (e.g., 'pdf', 'doc', 'xls').
            site_search: Site or domain to search within.
            site_search_filter: Site search filter. Options: 'i' (include) or 'e' (exclude).
            link_site: Find pages that link to the specified URL.
            or_terms: Additional terms to search for, with OR logic.
            related_site: Find pages related to the specified URL.
            additional_params: Any additional parameters to include in the request.
            
        Returns:
            Dict containing the search results.
            
        Raises:
            GoogleSearchError: If the search request fails.
            RateLimitExceededError: If rate limits are exceeded.
        """
        # Check rate limits before making the request
        self._check_rate_limits()
        
        # Build request parameters
        params = {
            'key': self.api_key,
            'cx': cx or self.search_engine_id,
            'q': query,
            'start': start,
            'num': min(num, 10),  # API limit is 10 results per request
            'safe': safe,
            'filter': filter
        }
        
        # Add optional parameters if provided
        if search_type:
            params['searchType'] = search_type
        if fields:
            params['fields'] = fields
        if sort:
            params['sort'] = sort
        if gl:
            params['gl'] = gl
        if cr:
            params['cr'] = cr
        if lr:
            params['lr'] = lr
        if rights:
            params['rights'] = rights
        if date_restrict:
            params['dateRestrict'] = date_restrict
        if exact_terms:
            params['exactTerms'] = exact_terms
        if exclude_terms:
            params['excludeTerms'] = exclude_terms
        if file_type:
            params['fileType'] = file_type
        if site_search:
            params['siteSearch'] = site_search
        if site_search_filter:
            params['siteSearchFilter'] = site_search_filter
        if link_site:
            params['linkSite'] = link_site
        if or_terms:
            params['orTerms'] = or_terms
        if related_site:
            params['relatedSite'] = related_site
            
        # Add any additional parameters
        params.update(additional_params)
        
        # Make the request with retry logic
        for attempt in range(self.max_retries + 1):
            try:
                response = requests.get(
                    self.BASE_URL,
                    params=params,
                    timeout=self.timeout
                )
                
                # Update rate limiting tracking
                self._update_request_count()
                
                # Check for HTTP errors
                response.raise_for_status()
                
                # Parse and return the JSON response
                return response.json()
                
            except requests.exceptions.RequestException as e:
                # Handle rate limiting errors
                if response.status_code == 429:
                    retry_after = int(response.headers.get('Retry-After', self.retry_delay))
                    if attempt < self.max_retries:
                        print(f"Rate limit exceeded. Retrying in {retry_after} seconds...")
                        time.sleep(retry_after)
                        continue
                    else:
                        raise RateLimitExceededError("Rate limit exceeded and max retries reached")
                
                # Handle other HTTP errors
                if attempt < self.max_retries:
                    print(f"Request failed: {e}. Retrying in {self.retry_delay} seconds...")
                    time.sleep(self.retry_delay)
                else:
                    raise GoogleSearchError(f"Search request failed after {self.max_retries} retries: {e}")
    
    # ============================================================================
    # SPECIALIZED SEARCH EXAMPLES
    # ============================================================================
    
    def search_by_date_range(
        self, 
        query: str, 
        start_date: Union[str, datetime],
        end_date: Union[str, datetime, None] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Search for results within a specific date range.
        
        Args:
            query: Search query string.
            start_date: Start date in YYYY-MM-DD format or as datetime object.
            end_date: End date in YYYY-MM-DD format or as datetime object. If None, defaults to current date.
            **kwargs: Additional parameters to pass to the search method.
            
        Returns:
            Dict containing the search results.
            
        Example:
            # Search for climate change articles from 2020
            results = api.search_by_date_range("climate change", "2020-01-01", "2020-12-31")
        """
        # Convert datetime objects to strings if needed
        if isinstance(start_date, datetime):
            start_date = start_date.strftime("%Y%m%d")
        else:
            # Ensure date string is in the correct format (YYYYMMDD)
            start_date = start_date.replace("-", "")
        
        if end_date is None:
            end_date = datetime.now().strftime("%Y%m%d")
        elif isinstance(end_date, datetime):
            end_date = end_date.strftime("%Y%m%d")
        else:
            # Ensure date string is in the correct format (YYYYMMDD)
            end_date = end_date.replace("-", "")
        
        # Format the sort parameter for date range
        sort_param = f"date:r:{start_date}:{end_date}"
        
        # Perform the search with the date range sort parameter
        return self.search(query, sort=sort_param, **kwargs)
    
    def search_by_year(self, query: str, year: int, **kwargs) -> Dict[str, Any]:
        """
        Search for results from a specific year.
        
        Args:
            query: Search query string.
            year: The year to restrict results to.
            **kwargs: Additional parameters to pass to the search method.
            
        Returns:
            Dict containing the search results.
            
        Example:
            # Search for AI breakthroughs in 2023
            results = api.search_by_year("AI breakthroughs", 2023)
        """
        # Use the dateRestrict parameter with 'y' prefix for year
        date_restrict = f"y{year}"
        
        # Alternative approach: use date range for the entire year
        # start_date = f"{year}-01-01"
        # end_date = f"{year}-12-31"
        # return self.search_by_date_range(query, start_date, end_date, **kwargs)
        
        return self.search(query, date_restrict=date_restrict, **kwargs)
    
    def search_specific_domain(self, query: str, domain: str, **kwargs) -> Dict[str, Any]:
        """
        Search for results within a specific domain.
        
        Args:
            query: Search query string.
            domain: Domain to restrict search to (e.g., 'example.com').
            **kwargs: Additional parameters to pass to the search method.
            
        Returns:
            Dict containing the search results.
            
        Example:
            # Search for machine learning articles on Stanford's website
            results = api.search_specific_domain("machine learning", "stanford.edu")
        """
        return self.search(query, site_search=domain, site_search_filter='i', **kwargs)
    
    def search_multiple_domains(self, query: str, domains: List[str], **kwargs) -> Dict[str, Any]:
        """
        Search for results across multiple specific domains.
        
        Args:
            query: Search query string.
            domains: List of domains to restrict search to.
            **kwargs: Additional parameters to pass to the search method.
            
        Returns:
            Dict containing the search results.
            
        Example:
            # Search for AI ethics across academic institutions
            results = api.search_multiple_domains(
                "AI ethics", 
                ["harvard.edu", "stanford.edu", "mit.edu"]
            )
        """
        # Modify the query to include site: operators for each domain
        domain_query = " OR ".join([f"site:{domain}" for domain in domains])
        enhanced_query = f"({query}) ({domain_query})"
        
        return self.search(enhanced_query, **kwargs)
    
    def search_exclude_domains(self, query: str, excluded_domains: List[str], **kwargs) -> Dict[str, Any]:
        """
        Search for results excluding specific domains.
        
        Args:
            query: Search query string.
            excluded_domains: List of domains to exclude from search results.
            **kwargs: Additional parameters to pass to the search method.
            
        Returns:
            Dict containing the search results.
            
        Example:
            # Search for climate change excluding news sites
            results = api.search_exclude_domains(
                "climate change", 
                ["cnn.com", "foxnews.com", "nytimes.com"]
            )
        """
        # Modify the query to exclude specified domains
        exclusion_terms = " ".join([f"-site:{domain}" for domain in excluded_domains])
        enhanced_query = f"{query} {exclusion_terms}"
        
        return self.search(enhanced_query, **kwargs)
    
    def search_file_types(self, query: str, file_types: List[str], **kwargs) -> Dict[str, Any]:
        """
        Search for specific file types.
        
        Args:
            query: Search query string.
            file_types: List of file types to search for (e.g., ['pdf', 'doc', 'ppt']).
            **kwargs: Additional parameters to pass to the search method.
            
        Returns:
            Dict containing the search results.
            
        Example:
            # Search for research papers as PDFs
            results = api.search_file_types("quantum computing research paper", ["pdf"])
        """
        # Create a query with OR conditions for each file type
        file_type_query = " OR ".join([f"filetype:{ft}" for ft in file_types])
        enhanced_query = f"{query} ({file_type_query})"
        
        return self.search(enhanced_query, **kwargs)
    
    def search_with_advanced_operators(
        self, 
        query: str,
        exact_phrase: Optional[str] = None,
        exclude_words: Optional[List[str]] = None,
        site_or_domain: Optional[str] = None,
        file_type: Optional[str] = None,
        in_title: Optional[str] = None,
        in_url: Optional[str] = None,
        related_to_url: Optional[str] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Search using advanced Google search operators.
        
        Args:
            query: Base search query string.
            exact_phrase: Phrase that must appear exactly as specified.
            exclude_words: Words that should not appear in results.
            site_or_domain: Site or domain to search within.
            file_type: File type to restrict results to.
            in_title: Text that must appear in the title.
            in_url: Text that must appear in the URL.
            related_to_url: Find pages related to the specified URL.
            **kwargs: Additional parameters to pass to the search method.
            
        Returns:
            Dict containing the search results.
            
        Example:
            # Complex search for Python programming tutorials excluding certain sites
            results = api.search_with_advanced_operators(
                "python programming",
                exact_phrase="beginner tutorial",
                exclude_words=["advanced", "expert"],
                file_type="pdf",
                in_title="learn"
            )
        """
        # Start with the base query
        enhanced_query = query
        
        # Add exact phrase if provided
        if exact_phrase:
            enhanced_query += f' "{exact_phrase}"'
        
        # Add excluded words if provided
        if exclude_words:
            for word in exclude_words:
                enhanced_query += f" -{word}"
        
        # Add site/domain restriction if provided
        if site_or_domain:
            enhanced_query += f" site:{site_or_domain}"
        
        # Add file type restriction if provided
        if file_type:
            enhanced_query += f" filetype:{file_type}"
        
        # Add title restriction if provided
        if in_title:
            enhanced_query += f" intitle:{in_title}"
        
        # Add URL restriction if provided
        if in_url:
            enhanced_query += f" inurl:{in_url}"
        
        # Add related URL if provided
        if related_to_url:
            enhanced_query += f" related:{related_to_url}"
        
        return self.search(enhanced_query, **kwargs)
    
    # ============================================================================
    # RESPONSE PARSING AND DATA EXTRACTION
    # ============================================================================
    
    def extract_search_results(self, response: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Extract and normalize search results from the API response.
        
        Args:
            response: The raw API response dictionary.
            
        Returns:
            List of dictionaries containing normalized search results.
            
        Example:
            response = api.search("artificial intelligence")
            results = api.extract_search_results(response)
            for result in results:
                print(f"Title: {result['title']}")
                print(f"URL: {result['link']}")
                print(f"Snippet: {result['snippet']}")
                print("---")
        """
        if not response or 'items' not in response:
            return []
        
        results = []
        for item in response['items']:
            # Extract basic information
            result = {
                'title': item.get('title', ''),
                'link': item.get('link', ''),
                'display_link': item.get('displayLink', ''),
                'snippet': item.get('snippet', ''),
                'html_snippet': item.get('htmlSnippet', ''),
                'cache_id': item.get('cacheId', None),
                'formatted_url': item.get('formattedUrl', ''),
                'html_formatted_url': item.get('htmlFormattedUrl', ''),
            }
            
            # Extract page map data if available
            if 'pagemap' in item:
                pagemap = item['pagemap']
                
                # Extract metatags
                if 'metatags' in pagemap and pagemap['metatags']:
                    metatags = pagemap['metatags'][0]
                    result['meta_description'] = metatags.get('og:description', metatags.get('description', ''))
                    result['meta_title'] = metatags.get('og:title', metatags.get('title', ''))
                    result['meta_image'] = metatags.get('og:image', '')
                
                # Extract thumbnail if available
                if 'cse_thumbnail' in pagemap and pagemap['cse_thumbnail']:
                    thumbnail = pagemap['cse_thumbnail'][0]
                    result['thumbnail'] = {
                        'src': thumbnail.get('src', ''),
                        'width': thumbnail.get('width', 0),
                        'height': thumbnail.get('height', 0)
                    }
                
                # Extract article information if available
                if 'article' in pagemap and pagemap['article']:
                    article = pagemap['article'][0]
                    result['article'] = {
                        'published_time': article.get('datepublished', ''),
                        'modified_time': article.get('datemodified', ''),
                        'author': article.get('author', ''),
                        'publisher': article.get('publisher', '')
                    }
            
            results.append(result)
        
        return results
    
    def extract_metadata(self, response: Dict[str, Any]) -> Dict[str, Any]:
        """
        Extract metadata from the search response.
        
        Args:
            response: The raw API response dictionary.
            
        Returns:
            Dictionary containing search metadata.
            
        Example:
            response = api.search("machine learning")
            metadata = api.extract_metadata(response)
            print(f"Total results: {metadata['total_results']}")
            print(f"Search time: {metadata['search_time']} seconds")
        """
        metadata = {
            'kind': response.get('kind', ''),
            'url': response.get('url', {}).get('type', ''),
            'total_results': int(response.get('searchInformation', {}).get('totalResults', 0)),
            'search_time': float(response.get('searchInformation', {}).get('searchTime', 0)),
            'formatted_search_time': response.get('searchInformation', {}).get('formattedSearchTime', ''),
            'formatted_total_results': response.get('searchInformation', {}).get('formattedTotalResults', ''),
        }
        
        # Extract spelling corrections if available
        if 'spelling' in response:
            metadata['spelling_correction'] = response['spelling'].get('correctedQuery', '')
        
        # Extract query information
        if 'queries' in response:
            if 'request' in response['queries']:
                metadata['request'] = response['queries']['request'][0]
            if 'nextPage' in response['queries']:
                metadata['next_page'] = response['queries']['nextPage'][0]
            if 'previousPage' in response['queries']:
                metadata['previous_page'] = response['queries']['previousPage'][0]
        
        return metadata
    
    def extract_structured_data(self, response: Dict[str, Any]) -> Dict[str, List[Dict[str, Any]]]:
        """
        Extract structured data from the search response.
        
        Args:
            response: The raw API response dictionary.
            
        Returns:
            Dictionary containing categorized structured data.
            
        Example:
            response = api.search("eiffel tower")
            structured_data = api.extract_structured_data(response)
            if 'images' in structured_data:
                for image in structured_data['images']:
                    print(f"Image URL: {image['src']}")
        """
        if not response or 'items' not in response:
            return {}
        
        structured_data = {
            'images': [],
            'videos': [],
            'people': [],
            'organizations': [],
            'locations': [],
            'events': [],
            'products': [],
            'reviews': []
        }
        
        for item in response['items']:
            if 'pagemap' not in item:
                continue
            
            pagemap = item['pagemap']
            
            # Extract images
            if 'cse_image' in pagemap:
                for image in pagemap['cse_image']:
                    if 'src' in image:
                        structured_data['images'].append(image)
            
            # Extract videos
            if 'videoobject' in pagemap:
                structured_data['videos'].extend(pagemap['videoobject'])
            
            # Extract people
            if 'person' in pagemap:
                structured_data['people'].extend(pagemap['person'])
            
            # Extract organizations
            if 'organization' in pagemap:
                structured_data['organizations'].extend(pagemap['organization'])
            
            # Extract locations
            if 'place' in pagemap:
                structured_data['locations'].extend(pagemap['place'])
            
            # Extract events
            if 'event' in pagemap:
                structured_data['events'].extend(pagemap['event'])
            
            # Extract products
            if 'product' in pagemap:
                structured_data['products'].extend(pagemap['product'])
            
            # Extract reviews
            if 'review' in pagemap:
                structured_data['reviews'].extend(pagemap['review'])
        
        # Remove empty categories
        return {k: v for k, v in structured_data.items() if v}
    
    # ============================================================================
    # PAGINATION HANDLING
    # ============================================================================
    
    def get_all_results(
        self, 
        query: str, 
        max_results: int = 100, 
        **kwargs
    ) -> List[Dict[str, Any]]:
        """
        Retrieve all search results by handling pagination automatically.
        
        Args:
            query: Search query string.
            max_results: Maximum number of results to retrieve (default: 100).
            **kwargs: Additional parameters to pass to the search method.
            
        Returns:
            List of dictionaries containing all search results.
            
        Example:
            # Get up to 50 results for "renewable energy"
            all_results = api.get_all_results("renewable energy", max_results=50)
            print(f"Retrieved {len(all_results)} results")
        """
        all_results = []
        results_per_page = min(10, max_results)  # API limit is 10 per request
        start_index = 1
        
        while len(all_results) < max_results:
            try:
                # Make the search request
                response = self.search(
                    query=query,
                    start=start_index,
                    num=results_per_page,
                    **kwargs
                )
                
                # Extract results from the response
                results = self.extract_search_results(response)
                
                # If no results were returned, we've reached the end
                if not results:
                    break
                
                # Add the results to our collection
                all_results.extend(results)
                
                # Update the start index for the next page
                start_index += len(results)
                
                # If we got fewer results than requested, we've reached the end
                if len(results) < results_per_page:
                    break
                
                # Respect rate limits with a small delay between requests
                time.sleep(1.0 / self.requests_per_second)
                
            except Exception as e:
                print(f"Error retrieving results: {e}")
                break
        
        # Trim to the requested maximum
        return all_results[:max_results]
    
    def get_paginated_results(
        self, 
        query: str, 
        page: int = 1, 
        results_per_page: int = 10, 
        **kwargs
    ) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
        """
        Get a specific page of search results.
        
        Args:
            query: Search query string.
            page: Page number (1-based).
            results_per_page: Number of results per page (max 10).
            **kwargs: Additional parameters to pass to the search method.
            
        Returns:
            Tuple containing (list of results, pagination metadata).
            
        Example:
            # Get the second page of results with 10 results per page
            results, pagination = api.get_paginated_results("climate change", page=2)
            print(f"Page {pagination['current_page']} of {pagination['total_pages']}")
        """
        # Ensure valid parameters
        page = max(1, page)
        results_per_page = min(10, results_per_page)  # API limit is 10
        
        # Calculate the start index
        start_index = ((page - 1) * results_per_page) + 1
        
        # Make the search request
        response = self.search(
            query=query,
            start=start_index,
            num=results_per_page,
            **kwargs
        )
        
        # Extract results and metadata
        results = self.extract_search_results(response)
        metadata = self.extract_metadata(response)
        
        # Calculate pagination information
        total_results = metadata['total_results']
        total_pages = (total_results + results_per_page - 1) // results_per_page
        
        pagination = {
            'current_page': page,
            'results_per_page': results_per_page,
            'total_results': total_results,
            'total_pages': total_pages,
            'has_previous_page': page > 1,
            'has_next_page': page < total_pages,
            'previous_page': max(1, page - 1),
            'next_page': min(total_pages, page + 1) if total_pages > 0 else 1,
        }
        
        return results, pagination
    
    # ============================================================================
    # RATE LIMITING
    # ============================================================================
    
    def _check_rate_limits(self):
        """
        Check if the current request would exceed rate limits.
        
        Raises:
            RateLimitExceededError: If the request would exceed rate limits.
        """
        # Check daily limit
        now = datetime.now()
        
        # Reset daily counter if a new day has started
        if now >= self.daily_reset_time:
            self.daily_request_count = 0
            self.daily_reset_time = now + timedelta(days=1)
        
        # Check if daily limit would be exceeded
        if self.daily_request_count >= self.requests_per_day:
            time_until_reset = self.daily_reset_time - now
            hours, remainder = divmod(time_until_reset.seconds, 3600)
            minutes, seconds = divmod(remainder, 60)
            reset_time_str = f"{hours}h {minutes}m {seconds}s"
            raise RateLimitExceededError(
                f"Daily request limit of {self.requests_per_day} exceeded. "
                f"Limit will reset in {reset_time_str}."
            )
        
        # Check per-second rate limit
        if self.requests_per_second > 0:
            # Remove timestamps older than 1 second
            current_time = time.time()
            self.request_timestamps = [
                ts for ts in self.request_timestamps 
                if current_time - ts < 1.0
            ]
            
            # Check if per-second limit would be exceeded
            if len(self.request_timestamps) >= self.requests_per_second:
                sleep_time = 1.0 - (current_time - self.request_timestamps[0])
                if sleep_time > 0:
                    time.sleep(sleep_time)
                    # After sleeping, we need to update timestamps again
                    self.request_timestamps = [
                        ts for ts in self.request_timestamps 
                        if time.time() - ts < 1.0
                    ]
    
    def _update_request_count(self):
        """
        Update the request count and timestamps after a successful request.
        """
        # Increment daily request counter
        self.daily_request_count += 1
        
        # Add current timestamp for per-second rate limiting
        self.request_timestamps.append(time.time())
