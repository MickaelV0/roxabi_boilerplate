import { createFileRoute } from '@tanstack/react-router'
import { LegalPageLayout } from '@/components/legal/LegalPageLayout'
import { legalConfig } from '@/config/legal.config'

export const Route = createFileRoute('/legal/mentions-legales')({
  component: MentionsLegalesPage,
})

function MentionsLegalesPage() {
  return (
    <LegalPageLayout title="Mentions Légales">
      <h2>Éditeur du site</h2>
      <p>
        Le site est édité par <strong>{legalConfig.companyName}</strong>, {legalConfig.legalForm} au
        capital de {legalConfig.shareCapital}.
      </p>
      <p>
        <strong>Siège social :</strong> {legalConfig.registeredAddress}
      </p>
      <p>
        <strong>RCS :</strong> {legalConfig.rcsNumber}
      </p>
      <p>
        <strong>SIRET :</strong> {legalConfig.siretNumber}
      </p>
      <p>
        <strong>TVA intracommunautaire :</strong> {legalConfig.vatNumber}
      </p>
      <p>
        <strong>Directeur de la publication :</strong> {legalConfig.publicationDirector}
      </p>

      <h2>Hébergeur</h2>
      <p>
        <strong>{legalConfig.host.name}</strong>
      </p>
      <p>{legalConfig.host.address}</p>
      <p>Téléphone : {legalConfig.host.phone}</p>

      <h2>Protection des données personnelles</h2>
      <p>
        Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez d'un
        droit d'accès, de rectification, de portabilité, d'opposition et de suppression de vos
        données personnelles.
      </p>
      <p>
        Pour exercer ces droits, vous pouvez contacter notre Délégué à la Protection des Données à
        l'adresse suivante :{' '}
        <a href={`mailto:${legalConfig.gdprContactEmail}`}>{legalConfig.gdprContactEmail}</a>
      </p>
    </LegalPageLayout>
  )
}
