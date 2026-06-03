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

  parameters {
    string(
      name: 'NEXT_PUBLIC_CIVI_CRM_URL',
      defaultValue: 'https://project-gzx4s.vercel.app',
      description: 'CiviCRM base URL inlined into the web build',
    )
    string(
      name: 'NEXT_PUBLIC_HCAPTCHA_SITEKEY',
      defaultValue: '2ec82f0e-5f3c-45d2-ba38-223ceb5eee42',
      description: 'Public hCaptcha site key for the apps/web hCaptcha widget.',
    )
  }

  stages {

    stage('Build the web app') {
      steps {
        script {
          withEnv([
            "NEXT_PUBLIC_SITE_URL=https://${deployDomain()}",
            "NEXT_PUBLIC_CIVI_CRM_URL=${params.NEXT_PUBLIC_CIVI_CRM_URL}",
            "NEXT_PUBLIC_HCAPTCHA_SITEKEY=${params.NEXT_PUBLIC_CIVI_CRM_URL}",
          ]) {
            nix.develop('pnpm --filter ./apps/web build',
              keepEnv: [
                'NEXT_PUBLIC_SITE_URL',
                'NEXT_PUBLIC_CIVI_CRM_URL',
                'NEXT_PUBLIC_HCAPTCHA_SITEKEY'
              ]
            )
          }
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