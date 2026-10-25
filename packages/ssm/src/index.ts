import { GetParameterCommand, PutParameterCommand, SSMClient } from '@aws-sdk/client-ssm'
import type { SSMService, SSMServiceOptions } from '@eguru/types'

export const createSSMService = ({
  accessKeyId,
  secretAccessKey,
  AWSRegion,
}: SSMServiceOptions): SSMService => {
  const credentials = {
    accessKeyId,
    secretAccessKey,
  }
  const ssm = new SSMClient({ region: AWSRegion, credentials })

  const get = async (name: string) => {
    const value = (
      await ssm.send(
        new GetParameterCommand({
          Name: name,
          WithDecryption: true,
        }),
      )
    ).Parameter?.Value

    if (value === undefined) {
      throw new Error(`SSM parameter ${name} is not set`)
    }

    return value
  }

  const set = async (name: string, value: string) =>
    ssm.send(
      new PutParameterCommand({
        Name: name,
        Value: value,
        Type: 'SecureString',
        Overwrite: true,
      }),
    )

  return { get, set }
}
