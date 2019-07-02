#!/bin/bash

set -e

resourceGroupName=$(az resource list -n 'suaggarTest1' --resource-type 'Microsoft.Web/Sites' --query '[0].resourceGroup' | xargs)
echo $resourceGroupName