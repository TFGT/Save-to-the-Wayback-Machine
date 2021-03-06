/*jslint node: true */
/*global debug, global, browser, Request */

"use strict";

/**
 * Save a page to the Wayback Machine
 * @param {string} url - URL of the page to archive
 * @param {callback} callback
 */
function archive(url, callback) {

	var request = new Request();
	request.open(global.urls.save + url, function (response) {
		debug.log(response.headers);

		var headers = response.headers,
			statusCode = response.status.toString(),
			runtimeError,
			status = {
				archived: false,
				url: url, // Page URL
				captureUrl: null, // Wayback Machine capture URL for the archived page.
				error: browser.i18n.getMessage('ArchiveFailedDefault'), // Default error note 
				code: 200 // Default HTTP status code
			};

		// Check for Wayback Runtime Error header
		if (headers.hasOwnProperty('x-archive-wayback-runtime-error')) {
			runtimeError = headers['x-archive-wayback-runtime-error'].split(':');

			if (runtimeError[0] === 'AdministrativeAccessControlException') { // Website or URL is excluded from Wayback Machine.
				status.error = browser.i18n.getMessage('ArchiveFailedWebsiteExcluded');

			} else if (runtimeError[0] === 'RobotAccessControlException') { // Blocked By robots.txt file.
				status.error = browser.i18n.getMessage('ArchiveFailedBlocked');

			} else if (runtimeError[0] === 'LiveDocumentNotAvailableException') { // Wayback Machine faild to fetch page.
				status.error = browser.i18n.getMessage('ArchiveFailedNotFetched');
			}

			status.code = statusCode;

		} else if (statusCode.match(global.regex.httpCodes)) { // Check HTTP status codes

			status.archived = true;
			status.code = statusCode;
			status.error = null;

			if (headers.hasOwnProperty('content-location')) {
				status.captureUrl = headers['content-location'];

			} else { // No Content-Location header, use page URL.
				status.captureUrl = '/' + url;
			}

		}

		/**
		 * @callback archive~callback
		 * @param {object} status - Details about the archived page.
		 */
		callback(status);

	});

}