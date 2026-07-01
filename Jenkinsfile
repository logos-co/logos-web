#!/usr/bin/env groovy
library 'status-jenkins-lib@v1.9.24'

pipeline {

  agent {
    docker {
      label 'linuxcontainer'
      image 'harbor.status.im/infra/ci-build-containers:linux-base-1.0.0'
      args '--volume=/nix:/nix ' +
           '--volume=/etc/nix:/etc/nix ' +
           '--volume=/var/run/docker.sock:/var/run/docker.sock ' +
           '--user jenkins'
    }
  }

  options {
    disableConcurrentBuilds()
    buildDiscarder(logRotator(
      numToKeepStr: '20',
      daysToKeepStr: '30',
    ))
  }

  environment {
    GIT_COMMITTER_NAME = 'status-im-auto'
    GIT_COMMITTER_EMAIL = 'auto@status.im'
  }

  parameters {
    string(
      name: 'NEXT_PUBLIC_HCAPTCHA_SITEKEY',
      defaultValue: '2ec82f0e-5f3c-45d2-ba38-223ceb5eee42',
      description: 'Public hCaptcha site key for the apps/web hCaptcha widget.',
    )
    string(
      name: 'DOCKER_CRED',
      description: 'Name of Docker Registry credential.',
      defaultValue: params.DOCKER_CRED ?: 'harbor-logos-web-robot',
    )
    string(
      name: 'DOCKER_REGISTRY_URL',
      description: 'URL of the Docker Registry',
      defaultValue: params.DOCKER_REGISTRY_URL ?: 'https://harbor.status.im',
    )
    string(
      name: 'IMAGE_TAG',
      description: 'Image tag',
      defaultValue: params.IMAGE_TAG ?: deployBranch(),
    )
    string(
      name: 'IMAGE_NAME',
      description: 'Name of the Docker image',
      defaultValue: 'logos-web/logos-cms',
    )
  }

  stages {

    stage('Build the web app') {
      steps {
        script {
          withEnv([
            "NEXT_PUBLIC_SITE_URL=https://${deployDomain()}",
            "NEXT_PUBLIC_CIVI_CRM_URL=${civiCrmUrl()}",
            "NEXT_PUBLIC_HCAPTCHA_SITEKEY=${params.NEXT_PUBLIC_HCAPTCHA_SITEKEY}",
            "NEXT_PUBLIC_API_MODE=${apiMode()}",
          ]) {
            nix.develop('pnpm --filter ./apps/web build',
              keepEnv: [
                'NEXT_PUBLIC_SITE_URL',
                'NEXT_PUBLIC_CIVI_CRM_URL',
                'NEXT_PUBLIC_HCAPTCHA_SITEKEY',
                'NEXT_PUBLIC_API_MODE'
              ]
            )
          }
        }
      }
    }

    stage('Publish web app') {
      steps {
        sshagent(credentials: ['status-im-auto-ssh']) {
          script {
            nix.develop("""
              ghp-import \
                -b ${deployBranch()} \
                -c ${deployDomain()} \
                -p apps/web/out
            """, sandbox: false,
                 keepEnv: ['SSH_AUTH_SOCK'])
          }
         }
      }
    }

    stage('Build CMS docker image') {
      steps {
        script {
          image = docker.build(
            "${params.IMAGE_NAME}:${params.IMAGE_TAG}",
            "--build-arg NEXT_PUBLIC_SERVER_URL=https://${cmsDomain()} " +
            "--build-arg NEXT_PUBLIC_WEB_URL=https://${deployDomain()} " +
            "-f ./apps/cms/Dockerfile ."
          )
        }
      }
    }

    stage('Push CMS docker image'){
      steps {
        script {
          withDockerRegistry([
            credentialsId: params.DOCKER_CRED, url: params.DOCKER_REGISTRY_URL
          ]) {
            image.push()
          }
        }
      }
    }
  }
  post {
    cleanup { cleanWs() }
  }
}
def isMasterBranch() { GIT_BRANCH ==~ /.*master/ }
def deployBranch() { isMasterBranch() ? 'deploy-master' : 'deploy-develop' }
def deployDomain() { isMasterBranch() ? 'logos.co' : 'dev.logos.co' }
def apiMode() { isMasterBranch() ? 'production' : 'staging' }
def civiCrmUrl() { isMasterBranch() ? 'https://logos-web-civi.vercel.app' : 'https://logos-web-civi-git-develop-status-im-web.vercel.app/' }
def cmsDomain() { isMasterBranch() ? 'cms.logos.co' : 'dev-cms.logos.co' }
