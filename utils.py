import requests
import json

from github import GithubException
from github.Repository import Repository


def update_github_pages(access_token: str, owner: str, repo: str):
    url = f"https://api.github.com/repos/{owner}/{repo}/pages"
    payload = json.dumps({
        "source": {
            "branch": "main",
            "path": "/"
            }
        })
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {access_token}'
        }

    response = requests.request("POST", url, headers=headers, data=payload)
    if response.status_code != 201:
        return None
    response = response.json()
    return response['html_url']


def add_github_actions(repo: Repository):
    file_path = ".github/workflows/deploy.yml"
    file_contents = """
            name: Deploy to GitHub Pages

            on:
              push:
                branches:
                  - main  # Trigger the action on push events to main branch

            jobs:
              deploy:
                runs-on: ubuntu-latest
                steps:
                  - name: Checkout 🛎️
                    uses: actions/checkout@v2.3.4

                  - name: Deploy to GitHub Pages 🚀
                    uses: JamesIves/github-pages-deploy-action@4.1.5
                    with:
                      branch: gh-pages # The branch the action should deploy to.
                      folder: . # The folder the action should deploy.
                      clean: true # Automatically remove deleted files from the deploy branch
                      commit-message: 'Deploy to GitHub Pages 🚀'
        """
    commit_message = "Added yml file for Github Actions Deployment"
    repo.create_file(file_path, commit_message, file_contents)


def add_create_file(repo: Repository):
    """
    Add/ update the file to the repository
    :param repo:
    :return:
    """
    file_list = [
        'templates/index.html',
        'templates/style.css',
        'templates/script.js',
        ]
    commit_message = 'Added new sample template files'
    for filepath in file_list:
        content = open(filepath).read()
        repo.create_file(filepath.replace('templates/', ''), commit_message, content, branch="main")
        return True