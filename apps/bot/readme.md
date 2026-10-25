# Настройка доступа к AWS

Инструкция рассчитана на запуск eguru вне AWS, например на локальном компьютере, VPS или другом облачном провайдере.

## 1. Создайте S3 bucket

1. Откройте AWS Console -> S3 -> **Create bucket**.
2. Выберите регион, в котором будет работать приложение, например `eu-central-1`.
3. Задайте имя eguru-app.
4. Оставьте включённой настройку **Block all public access**.
5. Создайте bucket.
6. Добавьте папки `development` и `production`.

Имя bucket и регион потребуется указать в переменных `AWS_BUCKET` и `AWS_REGION`.

## 2. Создайте параметры в Parameter Store

1. Откройте AWS Console -> Systems Manager -> Parameter Store.
2. Нажмите **Create parameter**.
3. Задайте имя /eguru/development/CRYPTO_SECRET
4. Выберите тип **SecureString** и стандартный AWS managed key `alias/aws/ssm`.
5. Повторите для /eguru/production/CRYPTO_SECRET
6. Создайте параметр /tradebot/AWS_S3_BUCKET со значением `eguru-app`.

## 3. Создайте IAM policy

Создайте customer managed policy с минимальными правами:

1. Откройте AWS Console -> **IAM**.
2. В левом меню выберите **Policies**.
3. Нажмите **Create policy**.
4. Откройте вкладку **JSON**.
5. Вставьте policy из примера ниже, замените 000000000000 на id аккаунта, которому принадлежат ресурсы.
6. Нажмите **Next** и проверьте разрешения.
7. Нажмите **Next**, укажите имя `eguru-policy`.
8. Нажмите **Create policy**.

Пример policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "kms:Decrypt",
      "Resource": "arn:aws:kms:eu-central-1:000000000000:alias/aws/ssm"
    },
    {
      "Sid": "ReadEguruParameters",
      "Effect": "Allow",
      "Action": ["ssm:GetParameter", "ssm:GetParameters", "ssm:DescribeParameters"],
      "Resource": [
        "arn:aws:ssm:eu-central-1:000000000000:parameter/eguru",
        "arn:aws:ssm:eu-central-1:000000000000:parameter/eguru/*"
      ]
    },
    {
      "Sid": "ManageEguruObjects",
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:PutObject", "s3:DeleteObject", "s3:ListBucket"],
      "Resource": ["arn:aws:s3:::eguru-app", "arn:aws:s3:::eguru-app/*"]
    }
  ]
}
```

После создания policy назначьте её IAM user приложения:

1. Откройте **IAM -> Users** и выберите пользователя приложения.
2. Перейдите на вкладку **Permissions**.
3. Нажмите **Add permissions**, из выпадающего меню выбрать **Add permissions**.
4. Выберите **Attach policies directly**.
5. Найдите policy `eguru-policy` и выберите её.
6. Нажмите **Add permissions**.
7. Откройте вкладку **Security credentials**.
8. Создайте **Access key** для `Application running outside AWS`.
9. Сохраните `Access key ID` и `Secret access key` сразу после создания.

## 5. Настройте переменные приложения

В пакете env создайте файлы environmentVariables_development.json и environmentVariables_production.json.

Укажите в файлах соответствующие значения для development и production:

```json
{
  "NODE_ENV": "development or production",
  "CHATGURU_SERVICE_CHANNEL": "name_of_service_channel",
  "XMPP_BOT_NAME": "eguru_test",
  "XMPP_BOT_PASSWORD": "eguru_password",
  "XMPP_VIRTUAL_HOST": "xmpp.virtual.host",
  "LOG_LEVEL": "debug",
  "CHATGURU_URL": "https://localhost:8443/api/s2s/",
  "CHATGURU_TOKEN": "CHATGURU USER TOKEN",
  "CHATGURU_APP_TOKEN": "CHATGURU_APP_TOKEN"
}
```

Создайте .env со следующими параметрами:

```dotenv
NODE_ENV="development"
AWS_REGION="eu-central-1"
AWS_ACCESS_KEY_ID="AWS_ACCESS_KEY_ID"
AWS_SECRET_ACCESS_KEY="AWS_SECRET_ACCESS_KEY"
SSM_APP_PARAMS_PREFIX="/eguru/"
```
