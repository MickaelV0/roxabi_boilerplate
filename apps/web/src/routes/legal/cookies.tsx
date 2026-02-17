import { createFileRoute } from '@tanstack/react-router'
import { LegalPageLayout } from '@/components/legal/LegalPageLayout'
import { useConsent } from '@/lib/consent'

export const Route = createFileRoute('/legal/cookies')({
  component: CookiesPage,
})

function CookiesPage() {
  const { openSettings } = useConsent()

  return (
    <LegalPageLayout title="Politique de Cookies">
      <h2>Qu'est-ce qu'un cookie ?</h2>
      <p>
        Un cookie est un petit fichier texte déposé sur votre terminal (ordinateur, tablette,
        smartphone) lors de la visite d'un site web. Il permet au site de mémoriser des informations
        sur votre visite, comme vos préférences de langue ou d'autres paramètres.
      </p>

      <h2>Les cookies que nous utilisons</h2>

      <h3>Cookies nécessaires</h3>
      <p>
        Ces cookies sont essentiels au fonctionnement du site. Ils permettent d'assurer la sécurité
        de votre connexion, de gérer votre session utilisateur et de mémoriser vos préférences de
        consentement. Ils ne peuvent pas être désactivés.
      </p>
      <ul>
        <li>
          <strong>Session :</strong> maintien de votre connexion authentifiée
        </li>
        <li>
          <strong>Sécurité :</strong> protection CSRF et tokens de vérification
        </li>
        <li>
          <strong>Consentement :</strong> mémorisation de vos choix en matière de cookies
        </li>
      </ul>

      <h3>Cookies analytiques</h3>
      <p>
        Ces cookies nous aident à comprendre comment vous utilisez le site en collectant des
        informations de manière anonyme. Ces données nous permettent d'améliorer les fonctionnalités
        et les performances du Service.
      </p>

      <h3>Cookies marketing</h3>
      <p>
        Ces cookies permettent de vous proposer des publicités pertinentes en fonction de vos
        centres d'intérêt. Ils peuvent être déposés par nos partenaires publicitaires.
      </p>

      <h2>Durée de conservation</h2>
      <p>
        Le cookie de consentement est conservé pendant <strong>6 mois</strong>. À l'expiration de
        cette durée, le bandeau de consentement vous sera présenté à nouveau pour recueillir vos
        préférences.
      </p>

      <h2>Gestion de vos préférences</h2>
      <p>
        Vous pouvez modifier vos préférences de cookies à tout moment en cliquant sur le bouton
        ci-dessous ou via le lien « Paramètres cookies » présent en pied de page.
      </p>
      <p>
        <button
          type="button"
          onClick={openSettings}
          className="text-primary underline underline-offset-4 hover:text-primary/80 cursor-pointer"
        >
          Gérer mes préférences de cookies
        </button>
      </p>
      <p>
        Vous pouvez également configurer votre navigateur pour bloquer ou supprimer les cookies.
        Notez que la désactivation de certains cookies peut affecter le fonctionnement du site.
      </p>
    </LegalPageLayout>
  )
}
