
//The app contains 1 filter, 1 directive, and 1 controller
//Note that for a bigger project, you should split your code in multiple files
var app = angular.module('angularMotion', []);

/**
 * Filter that converts seconds into an HH:MM:SS format
 * Credit: http://stackoverflow.com/a/6313008/962893
 */
app.filter('toHHMMSS', [function () {
	return function(value){
		var sec_num = parseInt(value, 10);
		var hours   = Math.floor(sec_num / 3600);
		var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
		var seconds = sec_num - (hours * 3600) - (minutes * 60);
		if (hours   < 10) {hours   = "0"+hours;}
		if (minutes < 10) {minutes = "0"+minutes;}
		if (seconds < 10) {seconds = "0"+seconds;}
		var time    = hours+':'+minutes+':'+seconds;
		return time;
	}
}]);

/**
 * Just put the "scrollable" attribute on a div to make it scrollable
 */
app.directive("scrollable", [function() {
	return {
		link: function(scope, elem) {
			elem.mCustomScrollbar({
				scrollInertia: 0,
				advanced:{
					updateOnContentResize: true
				},
				callbacks:{
					onTotalScrollOffset: 200,
					//Load more results on total scroll
					//Note: For some reason, onTotalScroll doesn't seem to work very well with the Mac trackpad
					onTotalScroll:function(){
						scope.getResults(false);
					}
				}
			});
		}
	};
}]);

/**
 * angularMotion is a small app, there is only one controller
 * Protip: The parameters are put in an array to be protected against minification
 * @param {object} $scope - It's the link between the view and the controller
 * @param {service} $http - Used to do ajax requests
 * @param {service} $sce  - http://docs.angularjs.org/api/ng.$sce
 */
app.controller('MainCtrl', ['$scope', '$http', '$sce', function ($scope, $http, $sce) {

	/* PRIVATE VARIABLES (Not accessible in the view)
	================================================== */

  //1 to play the video on start (0 otherwise)
	var autoplay = 1;

	//Let's listen some french music :>
	var defaultSearch = 'Daft punk veridis quo';

	//True if the Dailymotion API has more results
	var hasMoreResults = true;

	//Current page of results
	var currentPage = 1;

	/* PUBLIC VARIABLES (Accessible in the view)
	================================================== */

	//Current video id (with a default value)
	$scope.currentVideoId = 'x172fd';

	//The results from the Dailymotion data API will be stored here
	$scope.results = [];

	/* PUBLIC FUNCTIONS (Accessible in the view)
	================================================== */

	/**
	 * Build the video url that will be used by the iframe
	 * @return {string} - Dailymotion video url
	 */
	$scope.getVideoUrl = function () {
		var url = 'http://www.dailymotion.com/embed/video/' + $scope.currentVideoId + '?autoPlay=' + autoplay;
		return $sce.trustAsResourceUrl(url);
	};

	/**
	 * Update the current video id
	 * @param  {string} videoId - Dailymotion video id
	 */
	$scope.playVideo = function (videoId) {
    autoplay = 1;
    $scope.currentVideoId = videoId;
	};

	/**
	 * "Return an object that is trusted by angular for use in specified strict contextual escaping contexts"
	 * Cf: http://docs.angularjs.org/api/ng.$sce
	 * Note: Yes, I have no idea how to explain it
	 * @param  {string} input - Html
	 * @return {html}         - Usable html
	 */
	$scope.trustAsHtml = function (input) {
		return $sce.trustAsHtml(input);
	};

	/**
	 * Get videos from the Dailymotion data API
	 * @param  {bool} isANewSearch - True for a new search
	 *                             - False for a new page of the same search
	 */
	$scope.getResults = function(isANewSearch){
		//If it's a new search, start from the first page
		if (isANewSearch) {
			currentPage = 1;
			hasMoreResults = true;
		}
		//Else start from the next page
		else {
			currentPage += 1;
		}
		//If there is no more result, return
		if (!hasMoreResults) {
			console.log('No more results');
			return;
		}
		//Dailymotion data API url
		//fields: The informations we want to retrieve from the API
		//sort: Sorting
		//limit: Number of results
		//page: Page of results (for example, if limit=12 and page=2, we will get the videos from 13 to 24)
		var dailymotion_url =
			"https://api.dailymotion.com/videos?fields=duration,title,id,description&sort=relevance&limit=12&page=" + currentPage;
		//If the searchbar contains keywords, use them, else use the default keywords
		var keywords = $scope.searchTerms || defaultSearch;
		//Replace all the spaces by +
		keywords = keywords.split(' ').join('+');
		//Add the keywords to the url
		dailymotion_url = dailymotion_url + '&search=' + keywords;
		//Add the json callback at the end of the url
		dailymotion_url += '&callback=JSON_CALLBACK';
		//Ajax "Jsonp" request
		$http({method: "JSONP", url: dailymotion_url})
			.success(function(json) {
				//If it is a new search, replace the old results
				if(isANewSearch){
					$scope.results = json.list;
				}
				//Else, add the new results at the end of the array
				else{
					$scope.results.push.apply($scope.results, json.list);
				}
				//The API tells us if there is more results
				hasMoreResults = json.has_more;
			})
			.error(function (data) {
				console.log("Error", data);
			});
	};
}]);