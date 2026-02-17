import { createFileRoute } from '@tanstack/react-router'
import { LegalPageLayout } from '@/components/legal/LegalPageLayout'
import { legalConfig } from '@/config/legal.config'

export const Route = createFileRoute('/legal/confidentialite')({
  component: ConfidentialitePage,
})

function ConfidentialitePage() {
  return (
    <LegalPageLayout title="Politique de Confidentialité">
      <h2>Responsable du traitement</h2>
      <p>
        Le responsable du traitement des données personnelles est{' '}
        <strong>{legalConfig.companyName}</strong>, dont le siège social est situé au{' '}
        {legalConfig.registeredAddress}.
      </p>

      <h2>Données collectées</h2>
      <p>Dans le cadre de l'utilisation du Service, nous collectons les données suivantes :</p>
      <ul>
        <li>Nom et prénom</li>
        <li>Adresse e-mail</li>
        <li>Avatar (photo de profil)</li>
        <li>Adresse IP</li>
        <li>User-agent (informations sur le navigateur)</li>
      </ul>

      <h2>Finalités du traitement</h2>
      <p>Les données personnelles collectées sont utilisées pour les finalités suivantes :</p>
      <ul>
        <li>
          <strong>Fonctionnement du service :</strong> création et gestion de votre compte
          utilisateur, authentification, personnalisation de l'expérience
        </li>
        <li>
          <strong>Sécurité :</strong> détection et prévention des fraudes, protection contre les
          accès non autorisés
        </li>
        <li>
          <strong>Statistiques :</strong> analyse de l'utilisation du Service pour en améliorer les
          fonctionnalités (uniquement avec votre consentement)
        </li>
      </ul>

      <h2>Bases légales</h2>
      <p>Le traitement de vos données repose sur les bases légales suivantes :</p>
      <ul>
        <li>
          <strong>Consentement :</strong> pour les cookies analytiques et marketing
        </li>
        <li>
          <strong>Intérêt légitime :</strong> pour la sécurité du Service et la prévention des
          fraudes
        </li>
        <li>
          <strong>Obligation légale :</strong> pour le respect des obligations réglementaires
          applicables
        </li>
      </ul>

      <h2>Sous-traitants</h2>
      <p>Nous faisons appel aux sous-traitants suivants pour le fonctionnement du Service :</p>
      <ul>
        <li>
          <strong>Neon</strong> — Base de données (hébergement des données utilisateur)
        </li>
        <li>
          <strong>Upstash</strong> — Rate limiting (limitation du nombre de requêtes)
        </li>
        <li>
          <strong>Resend</strong> — Envoi d'e-mails transactionnels
        </li>
        <li>
          <strong>Vercel</strong> — Hébergement de l'application web et de l'API
        </li>
      </ul>

      <h2>Vos droits (RGPD)</h2>
      <p>
        Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez des
        droits suivants :
      </p>
      <ul>
        <li>
          <strong>Droit d'accès :</strong> obtenir la confirmation que vos données sont traitées et
          en obtenir une copie
        </li>
        <li>
          <strong>Droit de rectification :</strong> demander la correction de données inexactes ou
          incomplètes
        </li>
        <li>
          <strong>Droit à la portabilité :</strong> recevoir vos données dans un format structuré et
          lisible par machine
        </li>
        <li>
          <strong>Droit d'opposition :</strong> vous opposer au traitement de vos données pour des
          motifs légitimes
        </li>
        <li>
          <strong>Droit de suppression :</strong> demander l'effacement de vos données personnelles
        </li>
      </ul>
      <p>
        Pour exercer ces droits, contactez-nous à :{' '}
        <a href={`mailto:${legalConfig.gdprContactEmail}`}>{legalConfig.gdprContactEmail}</a>
      </p>

      <h2>Autorité de contrôle</h2>
      <p>
        Si vous estimez que le traitement de vos données personnelles constitue une violation du
        RGPD, vous pouvez introduire une réclamation auprès de la CNIL :{' '}
        <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer">
          www.cnil.fr
        </a>
      </p>
    </LegalPageLayout>
  )
}
