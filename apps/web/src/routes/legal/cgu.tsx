import { createFileRoute } from '@tanstack/react-router'
import { LegalPageLayout } from '@/components/legal/LegalPageLayout'
import { legalConfig } from '@/config/legal.config'

export const Route = createFileRoute('/legal/cgu')({
  component: CguPage,
})

function CguPage() {
  return (
    <LegalPageLayout title="Conditions Générales d'Utilisation">
      <h2>Article 1 — Objet</h2>
      <p>
        Les présentes Conditions Générales d'Utilisation (ci-après « CGU ») ont pour objet de
        définir les conditions d'accès et d'utilisation du service proposé par{' '}
        {legalConfig.companyName} (ci-après « le Service »).
      </p>

      <h2>Article 2 — Acceptation des CGU</h2>
      <p>
        L'utilisation du Service implique l'acceptation pleine et entière des présentes CGU. Si vous
        n'acceptez pas ces conditions, vous ne devez pas utiliser le Service.
      </p>

      <h2>Article 3 — Description du service</h2>
      <p>
        Le Service est une plateforme SaaS permettant aux utilisateurs de gérer leurs activités en
        ligne. Les fonctionnalités exactes du Service sont décrites sur le site.
      </p>

      <h2>Article 4 — Accès au service</h2>
      <p>
        Le Service est accessible gratuitement ou via un abonnement payant selon les offres
        disponibles. {legalConfig.companyName} se réserve le droit de modifier, suspendre ou
        interrompre l'accès au Service à tout moment, avec ou sans préavis.
      </p>

      <h2>Article 5 — Propriété intellectuelle</h2>
      <p>
        L'ensemble des contenus présents sur le Service (textes, images, logos, logiciels, bases de
        données) est protégé par le droit de la propriété intellectuelle et reste la propriété
        exclusive de {legalConfig.companyName} ou de ses partenaires.
      </p>
      <p>
        Toute reproduction, représentation, modification ou exploitation non autorisée de tout ou
        partie du Service est interdite.
      </p>

      <h2>Article 6 — Responsabilité</h2>
      <p>
        {legalConfig.companyName} s'efforce de maintenir le Service accessible et fonctionnel, mais
        ne peut garantir une disponibilité permanente. La responsabilité de{' '}
        {legalConfig.companyName} ne saurait être engagée en cas d'interruption du Service pour
        maintenance, mise à jour ou pour toute cause indépendante de sa volonté.
      </p>
      <p>
        L'utilisateur est seul responsable de l'utilisation qu'il fait du Service et des contenus
        qu'il y publie.
      </p>

      <h2>Article 7 — Données personnelles</h2>
      <p>
        Le traitement des données personnelles dans le cadre du Service est régi par notre{' '}
        <a href="/legal/confidentialite">Politique de Confidentialité</a>.
      </p>

      <h2>Article 8 — Droit applicable</h2>
      <p>Les présentes CGU sont régies par le droit français.</p>

      <h2>Article 9 — Juridiction compétente</h2>
      <p>
        En cas de litige relatif à l'interprétation ou à l'exécution des présentes CGU, les
        tribunaux compétents du ressort du siège social de {legalConfig.companyName} seront seuls
        compétents, sauf disposition légale contraire.
      </p>
    </LegalPageLayout>
  )
}
