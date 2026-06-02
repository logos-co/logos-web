#!/usr/bin/env groovy
library 'status-jenkins-lib@v1.9.24'
pipeline {
  agent {
    docker {
      label 'linuxcontainer'
      image 'harbor.status.im/infra/ci-build-containers:linux-base-1.0.0'
      args '--volume=/nix:/nix ' +
           '--volume=/etc/nix:/etc/nix '
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
  stages {
    stage('Build the web app') {
      steps {
        script {
          nix.develop('pnpm --filter ./apps/web build')
        }
      }
    }
    stage('Publish') {
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
  }
  post {
    cleanup { cleanWs() }
  }
}
def isMasterBranch() { GIT_BRANCH ==~ /.*master/ }
def deployBranch() { isMasterBranch() ? 'deploy-master' : 'deploy-develop' }
def deployDomain() { isMasterBranch() ? 'logos.co' : 'dev.logos.co' }