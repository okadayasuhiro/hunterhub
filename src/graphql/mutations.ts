/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "../API";
type GeneratedMutation<InputType, OutputType> = string & {
  __generatedMutationInput: InputType;
  __generatedMutationOutput: OutputType;
};

export const createGameScore = /* GraphQL */ `mutation CreateGameScore(
  $input: CreateGameScoreInput!
  $condition: ModelGameScoreConditionInput
) {
  createGameScore(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.CreateGameScoreMutationVariables,
  APITypes.CreateGameScoreMutation
>;
export const updateGameScore = /* GraphQL */ `mutation UpdateGameScore(
  $input: UpdateGameScoreInput!
  $condition: ModelGameScoreConditionInput
) {
  updateGameScore(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.UpdateGameScoreMutationVariables,
  APITypes.UpdateGameScoreMutation
>;
export const deleteGameScore = /* GraphQL */ `mutation DeleteGameScore(
  $input: DeleteGameScoreInput!
  $condition: ModelGameScoreConditionInput
) {
  deleteGameScore(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.DeleteGameScoreMutationVariables,
  APITypes.DeleteGameScoreMutation
>;
export const createUserProfile = /* GraphQL */ `mutation CreateUserProfile(
  $input: CreateUserProfileInput!
  $condition: ModelUserProfileConditionInput
) {
  createUserProfile(input: $input, condition: $condition) {
    id
    userId
    username
    totalGamesPlayed
    createdAt
    lastActiveAt
    fingerprintQuality
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.CreateUserProfileMutationVariables,
  APITypes.CreateUserProfileMutation
>;
export const updateUserProfile = /* GraphQL */ `mutation UpdateUserProfile(
  $input: UpdateUserProfileInput!
  $condition: ModelUserProfileConditionInput
) {
  updateUserProfile(input: $input, condition: $condition) {
    id
    userId
    username
    totalGamesPlayed
    createdAt
    lastActiveAt
    fingerprintQuality
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.UpdateUserProfileMutationVariables,
  APITypes.UpdateUserProfileMutation
>;
export const deleteUserProfile = /* GraphQL */ `mutation DeleteUserProfile(
  $input: DeleteUserProfileInput!
  $condition: ModelUserProfileConditionInput
) {
  deleteUserProfile(input: $input, condition: $condition) {
    id
    userId
    username
    totalGamesPlayed
    createdAt
    lastActiveAt
    fingerprintQuality
    updatedAt
    __typename
  }
}
` as GeneratedMutation<
  APITypes.DeleteUserProfileMutationVariables,
  APITypes.DeleteUserProfileMutation
>;
