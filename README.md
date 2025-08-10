# shiny-bassoon

## Development with Docker

Run the app locally using docker compose:

```sh
docker compose up
```

This starts a Node 18 container running `npm run dev` and exposes Vite on [http://localhost:5173](http://localhost:5173).

## Deployment

The repository includes a multi-stage `Dockerfile` that builds the project and serves it from `nginx`.

### Deploying on Render

1. Push this repository to a Git provider (e.g. GitHub).
2. Create a new **Web Service** on [Render](https://render.com/) and select **Deploy from a Git repository**.
3. Choose this repository and pick **Docker** as the environment.
4. Render builds the image using the `Dockerfile` and launches `nginx` on port 80.
5. After the build finishes, your site is live at the URL Render provides.
