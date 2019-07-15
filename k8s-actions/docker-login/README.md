# Usage

```yaml
- uses: ds-ms/k8s-actions/docker-login@master
  with:
    username: '<username>'
    password: '<password>'
    loginServer: '<login server>' # default: index.docker.io
    email: '<email id>'
```