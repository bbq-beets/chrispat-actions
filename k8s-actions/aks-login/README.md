# Usage

```yaml
uses: ds-ms/k8s-actions/aks-login@master
    with:
        servicePrincipalId: '<service principal id>'
        servicePrincipalKey: '<service principal key>'
        tenantId: '<tenant id>'
        subscriptionId: '<subscription id>'
        resourceGroupName: '<resource group name>'
        clusterName: '<cluster name>'
    id: login
```