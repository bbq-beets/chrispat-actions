#!/bin/bash

set -e

echo `${TEST}`
#RESOURCE_GROUP_NAME=$(az resource list -n "suaggarTest1" --resource-type "Microsoft.Web/Sites" --query '[0].resourceGroup' | xargs)
#echo `${RESOURCE_GROUP_NAME}` >&2