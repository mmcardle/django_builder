
const userVerified = (user) => {
  const githubVerified = user.providerData.find(
    (p) => p.providerId === 'github.com'
  )
  return githubVerified !== undefined || user.emailVerified || user.isAnonymous
}

export {userVerified}
