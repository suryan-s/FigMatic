from typing import List

import requests
from Secweb.ContentSecurityPolicy import ContentSecurityPolicy
from fastapi import FastAPI, File, UploadFile, Request
from fastapi.middleware.cors import CORSMiddleware
from github import Github, Auth, GithubException

from utils import add_github_actions, add_create_file, update_github_pages

app = FastAPI()
app.add_middleware(ContentSecurityPolicy,
                   Option={
                       'default-src': ["'self'"],
                       'base-uri': ["'self'"],
                       'block-all-mixed-content': []
                       },
                   script_nonce=False,
                   style_nonce=False
                   )
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    )


@app.get("/")
async def root():
    return { "message": "This is the base url for the FigMatic API" }


@app.post("/api/create-repo/")
async def create_repo(request: Request):
    """
    Create a new repository
    :param request:
    :return:
    """
    body = await request.json()
    g = Github(auth=Auth.Token(body['access_token']))
    user = g.get_user()
    try:
        is_repo_exists = True if user.get_repo(body['repo_name']) else False
    except GithubException:
        is_repo_exists = False

    if not is_repo_exists:
        try:
            user.create_repo(body['repo_name'], private=False)
            repo = user.get_repo(body['repo_name'])
            repo.create_file(
                'README.md',
                'Added README.md',
                open('templates/README.md').read()
                )
            add_github_actions(repo)
            html_url = update_github_pages(body['access_token'], owner=repo.owner.name, repo=repo.name)
            add_create_file(repo)

            return { "message": "Repository created successfully", "html_url": html_url, "status": "success",
                     "code": "201" }
        except GithubException:
            return { "message": "Repository already exists", "status": "error", "code": "422" }
    else:
        return { "message": "Repository already exists", "status": "error", "code": "422" }


@app.put("/api/deploy")
async def deploy(request: Request, files: List[UploadFile] = File(...)):
    """
    Deploy the files to GitHub pages
    :param request:
    :param files:
    :return:
    """
    body = await request.json()
    access_token = body['access_token']
    repo_name = body['repo_name']

    if len(files) == 0:
        return {
            "message": "No files to deploy. Using the default files for deployment",
            "status": "success",
            "code": "200"
            }
    else:
        g = Github(auth=Auth.Token(access_token))
        user = g.get_user()
        try:
            repo = user.get_repo(repo_name)
            repo_contents = repo.get_contents("")
            items_not_to_delete = { "README.md", ".github" }  # use a set for O(1) lookups

            # filter out items not to be deleted directly using list comprehension
            contents_to_delete = [content for content in repo_contents if content.name not in items_not_to_delete]

            for content in contents_to_delete:
                repo.delete_file(content.path, "Deleted existing files", content.sha)

            for file in files:
                repo.create_file(file.filename, "Added new files", str(file.file.read()))

            return { "message": "Files deployed successfully", "status": "success", "code": "201" }
        except GithubException:
            return { "message": "Repository does not exist", "status": "error", "code": "422" }


@app.get("/api/deploy/status")
async def deploy_status(request: Request):
    """
    Get the status of the deployment
    :param request:
    :return:
    """
    body = await request.json()
    access_token = body['access_token']
    repo_name = body['repo_name']
    g = Github(auth=Auth.Token(access_token))
    user = g.get_user()
    try:
        repo = user.get_repo(repo_name)
        repo_name = repo.name
        owner = repo.owner.name
        url = f"https://{owner}.github.io/{repo_name}/"
        response = requests.request("GET", url)
        if response.status_code == 200:
            return { "message": "Deployment successful", "status": "success", "code": "200" }
        else:
            return { "message": "Deployment ongoing", "status": "error", "code": "422" }
    except GithubException:
        return { "message": "Repository does not exist", "status": "error", "code": "404" }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app)