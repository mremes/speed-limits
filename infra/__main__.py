"""Azure Static Website infrastructure for speed-limits app."""

import os
import mimetypes
import pulumi
from pulumi_azure_native import storage, resources

config = pulumi.Config()
location = config.get("location") or "northeurope"

resource_group = resources.ResourceGroup(
    "speed-limits-rg",
    resource_group_name="speed-limits-rg",
    location=location,
)

account = storage.StorageAccount(
    "speedlimits",
    resource_group_name=resource_group.name,
    location=resource_group.location,
    sku={"name": storage.SkuName.STANDARD_LRS},
    kind=storage.Kind.STORAGE_V2,
    allow_blob_public_access=True,
)

# Enable static website hosting on the storage account
static_website = storage.StorageAccountStaticWebsite(
    "staticWebsite",
    account_name=account.name,
    resource_group_name=resource_group.name,
    index_document="index.html",
    error404_document="index.html",
)

# Upload files from dist/ to the $web container
dist_dir = os.path.join(os.path.dirname(__file__), "..", "dist")

for filename in os.listdir(dist_dir):
    filepath = os.path.join(dist_dir, filename)
    if not os.path.isfile(filepath):
        continue

    content_type = mimetypes.guess_type(filename)[0] or "application/octet-stream"

    storage.Blob(
        filename,
        account_name=account.name,
        resource_group_name=resource_group.name,
        container_name=static_website.container_name,
        source=pulumi.FileAsset(filepath),
        content_type=content_type,
    )

# Export the static website URL
pulumi.export("url", account.primary_endpoints.apply(lambda ep: ep.web))
pulumi.export("storage_account_name", account.name)
