# Estimated Time to Sell (ETS)
This software calculates the Estimated Time to Sell an item on eBay.

## Fetching completed items from eBay
Since eBay has deprecated their findCompletedItems endpoint from their API, this software fetches items directly from given eBay ads URLs with puppyteer. Furthermore, the software determines, if the given ads were sold under an auction or were 'buy now' items. To determine the start date of an ad, the software tries to get the date of the first bid, if the ad was an auction or tries to get the date of the first revision of a 'buy now' ad. If a 'buy now' ad has no revisions, the start date is not determinable.

## Caution: Start date may not be accurate
The date of the first bid of an auction is always the start date of an auction. On the other hand, the first revision of a 'buy now' ad may not be on the same day as the initial release day.