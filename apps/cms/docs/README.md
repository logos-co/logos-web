# Logos CMS docs

Reference for the Payload CMS admin app: the code in [`apps/cms/src`](../src) and [`apps/cms/scripts`](../scripts), plus the deployment files [`apps/cms/Dockerfile`](../Dockerfile) and [`docker-compose.prod.yml`](../../../docker-compose.prod.yml).

- [environment.md](environment.md): every environment variable the CMS reads, with defaults.
- [deployment.md](deployment.md): building the Docker image, migrations, creating the first admin, the health check.
- [publishing.md](publishing.md): the Build staging and Publish live buttons, and the reservation that stops two publishes running at once.
