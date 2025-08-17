/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "../API";
type GeneratedSubscription<InputType, OutputType> = string & {
  __generatedSubscriptionInput: InputType;
  __generatedSubscriptionOutput: OutputType;
};

export const onCreateGameScore = /* GraphQL */ `subscription OnCreateGameScore($filter: ModelSubscriptionGameScoreFilterInput) {
  onCreateGameScore(filter: $filter) {
    id
    userId
    gameType
    score
    metadata
    sessionId
    timestamp
    displayName
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnCreateGameScoreSubscriptionVariables,
  APITypes.OnCreateGameScoreSubscription
>;
export const onUpdateGameScore = /* GraphQL */ `subscription OnUpdateGameScore($filter: ModelSubscriptionGameScoreFilterInput) {
  onUpdateGameScore(filter: $filter) {
    id
    userId
    gameType
    score
    metadata
    sessionId
    timestamp
    displayName
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnUpdateGameScoreSubscriptionVariables,
  APITypes.OnUpdateGameScoreSubscription
>;
export const onDeleteGameScore = /* GraphQL */ `subscription OnDeleteGameScore($filter: ModelSubscriptionGameScoreFilterInput) {
  onDeleteGameScore(filter: $filter) {
    id
    userId
    gameType
    score
    metadata
    sessionId
    timestamp
    displayName
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnDeleteGameScoreSubscriptionVariables,
  APITypes.OnDeleteGameScoreSubscription
>;
export const onCreateUserProfile = /* GraphQL */ `subscription OnCreateUserProfile(
  $filter: ModelSubscriptionUserProfileFilterInput
) {
  onCreateUserProfile(filter: $filter) {
    id
    userId
    username
    totalGamesPlayed
    createdAt
    lastActiveAt
    fingerprintQuality
    xLinked
    xDisplayName
    xProfileImageUrl
    xLinkedAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnCreateUserProfileSubscriptionVariables,
  APITypes.OnCreateUserProfileSubscription
>;
export const onUpdateUserProfile = /* GraphQL */ `subscription OnUpdateUserProfile(
  $filter: ModelSubscriptionUserProfileFilterInput
) {
  onUpdateUserProfile(filter: $filter) {
    id
    userId
    username
    totalGamesPlayed
    createdAt
    lastActiveAt
    fingerprintQuality
    xLinked
    xDisplayName
    xProfileImageUrl
    xLinkedAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnUpdateUserProfileSubscriptionVariables,
  APITypes.OnUpdateUserProfileSubscription
>;
export const onDeleteUserProfile = /* GraphQL */ `subscription OnDeleteUserProfile(
  $filter: ModelSubscriptionUserProfileFilterInput
) {
  onDeleteUserProfile(filter: $filter) {
    id
    userId
    username
    totalGamesPlayed
    createdAt
    lastActiveAt
    fingerprintQuality
    xLinked
    xDisplayName
    xProfileImageUrl
    xLinkedAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnDeleteUserProfileSubscriptionVariables,
  APITypes.OnDeleteUserProfileSubscription
>;
export const onCreateGameHistory = /* GraphQL */ `subscription OnCreateGameHistory(
  $filter: ModelSubscriptionGameHistoryFilterInput
) {
  onCreateGameHistory(filter: $filter) {
    id
    userId
    gameType
    gameData
    playedAt
    displayName
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnCreateGameHistorySubscriptionVariables,
  APITypes.OnCreateGameHistorySubscription
>;
export const onUpdateGameHistory = /* GraphQL */ `subscription OnUpdateGameHistory(
  $filter: ModelSubscriptionGameHistoryFilterInput
) {
  onUpdateGameHistory(filter: $filter) {
    id
    userId
    gameType
    gameData
    playedAt
    displayName
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnUpdateGameHistorySubscriptionVariables,
  APITypes.OnUpdateGameHistorySubscription
>;
export const onDeleteGameHistory = /* GraphQL */ `subscription OnDeleteGameHistory(
  $filter: ModelSubscriptionGameHistoryFilterInput
) {
  onDeleteGameHistory(filter: $filter) {
    id
    userId
    gameType
    gameData
    playedAt
    displayName
    createdAt
    updatedAt
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnDeleteGameHistorySubscriptionVariables,
  APITypes.OnDeleteGameHistorySubscription
>;
