type RequiredKeysResponse = string;

export const getProofWaxRequiredKeys = async (
  rpcUrl: string
): Promise<RequiredKeysResponse> => {
  const response: any = await fetch(`${rpcUrl}/v1/chain/get_account`, {
    body: JSON.stringify({
      account_name: "proof.wax",
    }),
    method: "POST",
  }).then((e) => e.json());
  if (response.permissions) {
    for (const perm of response.permissions) {
      if (perm.perm_name === "active") {
        return perm.required_auth.keys[0].key;
      }
    }
  }
  return "";
};
