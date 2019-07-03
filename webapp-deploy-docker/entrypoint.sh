#!/bin/bash

set -e

RESOURCE_GROUP=$(az resource list -n 'suaggarTest1' --resource-type 'Microsoft.Web/Sites' --query '[0].resourceGroup' | xargs)
if [ -z "$RESOURCE_GROUP" ]; then
echo "Ensure the app exists." >&2
exit 1
fi
echo $RESOURCE_GROUP