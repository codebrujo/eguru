import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import type { S3Service, S3ServiceOptions } from '@eguru/types'
export type { S3Service, S3ServiceOptions } from '@eguru/types'

export const createS3Service = ({
  accessKeyId,
  secretAccessKey,
  AWSRegion,
  bucket,
}: S3ServiceOptions): S3Service => {
  const credentials = {
    accessKeyId,
    secretAccessKey,
  }
  const s3Client = new S3Client({ region: AWSRegion, credentials })

  const get = async (key: string) => {
    const { Body } = await s3Client.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      }),
    )

    if (!Body) {
      throw new Error(`Failed to retrieve ${key}`)
    }

    return Body.transformToString()
  }

  const put = async (key: string, data: string) =>
    s3Client
      .send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: data,
          ContentType: 'application/json',
        }),
      )
      .then(() => {})

  return { get, put }
}
