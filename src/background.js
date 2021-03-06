var clientId = "lz5fzvz4n25eiy8p99vzs4pjwyb15t";
var timeout = 30 * 1000;

var tabsToMonitor = [];

function checkTabs() {
	for (var i = 0; i < tabsToMonitor.length; i++) {
		try {
			var tabInfo = tabsToMonitor[i];
			goToTopStreamForGame(tabInfo.tabId);
		}
		catch(e) {
			console.log("Exception occurred");
		}
	}

	setTimeout(checkTabs, timeout);
}

function getTabInfo(tabId) {
	for (var i = 0; i < tabsToMonitor.length; i++) {
		var tabInfo = tabsToMonitor[i];
		if (tabInfo.tabId == tabId) {
			return tabInfo;
		}
	}
	return null;
}

function isTwitchPeakTab(tabId) {
	var tabInfo = getTabInfo();

	if (tabInfo == null) {
		return false;
	}
	return true;
}

function goToTopStreamForGame(tabId) {
	var tabInfo = getTabInfo(tabId);

	chrome.tabs.get(tabId, function(tab) {
		var requestData = {
			"game": tabInfo.gameName,
			"client_id": clientId,
			"limit": 10
		};

		$.ajax({
			url: "https://api.twitch.tv/kraken/streams",
			data: requestData,
			method: "GET"
		}).done(function(responseData) {
			if (responseData.streams.length == 0) {
				return;
			}

			for (var i = 0; i < responseData.streams.length; i++) {
				var topStream = responseData.streams[0];

				if (!tabInfo.allowMatureContent && topStream.channel.mature) {
					continue;
				}

				var streamUrl;

				if (tabInfo.isFullscreen) {
					streamUrl = "http://player.twitch.tv/?channel=" + topStream.channel.name;
				}
				else {
					streamUrl = "https://www.twitch.tv/" + topStream.channel.name;
				}

				if (tab.url == streamUrl) {
					return;
				}

				chrome.tabs.update(tabId, {"url": streamUrl});

				break;
			}
		});
	});
}

function addTab(options) {
	var createOptions = {
		"active": true
	};

	chrome.tabs.create(createOptions, function(tab) {
		options["tabId"] = tab.id;
		tabsToMonitor.push(options);
		goToTopStreamForGame(tab.id);
	});
}

chrome.tabs.onRemoved.addListener(function(tabId) {
	for (var i = 0; i < tabsToMonitor.length; i++) {
		var tabInfo = tabsToMonitor[i];
		if (tabInfo.tabId == tabId) {
			tabsToMonitor.splice(i);
			break;
		}
	}
});

checkTabs();