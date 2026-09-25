self.__MIDDLEWARE_MATCHERS = [
  {
    "regexp": "^(?:\\/(_next\\/data\\/[^/]{1,}))?(?:\\/((?!api|_next|_vercel|past-present-future(?:\\/|$)|.*\\..*).*))(\\.json)?[\\/#\\?]?$",
    "originalSource": "/((?!api|_next|_vercel|past-present-future(?:/|$)|.*\\..*).*)"
  }
];self.__MIDDLEWARE_MATCHERS_CB && self.__MIDDLEWARE_MATCHERS_CB()