import {
  UserRoles,
  type CreateUserServiceOptions,
  type User,
  type UserService,
} from '@eguru/types'
export { UserRoles } from '@eguru/types'

const BUCKET_KEY_NAME = 'users'

const defaultUser: User = {
  id: '',
  name: '',
  roles: [UserRoles.USER],
}

export const createUserService = async ({
  s3,
  crypto,
  env,
}: CreateUserServiceOptions): Promise<UserService> => {
  const configKey = `${env.getOrThrow('NODE_ENV')}/${BUCKET_KEY_NAME}`

  const loadUsersFromS3 = async () => {
    const res = await s3.get(configKey)
    const decrypted = crypto.decrypt(res)
    return JSON.parse(decrypted) as User[]
  }

  let users = await loadUsersFromS3()

  console.log(`Loaded ${users.length} users from ${configKey} s3 bucket`)

  const loadUsers = async () => {
    users = await loadUsersFromS3()
    return users
  }

  const getById = (id: string) => {
    return users.find((x) => x.id === id)
  }

  const getDefaultUser = (id: string) => {
    return {
      ...defaultUser,
      id,
      username: id,
    }
  }

  return {
    loadUsers,
    getById,
    getDefaultUser,
  }
}
