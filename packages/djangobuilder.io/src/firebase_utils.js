
const userVerified = (user) => {
  const githubVerified = user.providerData.find(
    (p) => p.providerId === 'github.com'
  )
  return githubVerified !== undefined || user.emailVerified || user.isAnonymous
}

// Where Firebase sends a user after they click an email verification link.
// import.meta.env.BASE_URL is '/' in dev and '/legacy/' in the built app, so
// the link comes back to this (hash-routed) app rather than the root app.
const emailActionContinueUrl = () =>
  window.location.origin + import.meta.env.BASE_URL + '#/login/'

export {userVerified, emailActionContinueUrl}
