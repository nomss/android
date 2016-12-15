package noman.arain.testPlugin;

import org.apache.cordova.CallbackContext;
//import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.PluginResult;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;


import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager.NameNotFoundException;
import android.os.Bundle;
import android.support.annotation.Nullable;
import android.util.Log;

import com.google.android.gms.auth.api.Auth;
import com.google.android.gms.auth.api.signin.GoogleSignInAccount;
import com.google.android.gms.auth.api.signin.GoogleSignInOptions;
import com.google.android.gms.auth.api.signin.GoogleSignInResult;
import com.google.android.gms.common.ConnectionResult;
import com.google.android.gms.common.SignInButton;
import com.google.android.gms.common.api.GoogleApiClient;
import com.google.android.gms.common.api.OptionalPendingResult;
import com.google.android.gms.common.api.ResultCallback;
import com.google.android.gms.common.api.Status;
import com.webileapps.fragments.CordovaFragment;
import android.support.v4.app.FragmentTransaction;

public class TestPlugin extends CordovaFragment implements
		GoogleApiClient.OnConnectionFailedListener {
	private static final String TAG = TestPlugin.class.getSimpleName();

	private static GoogleApiClient mGoogleApiClient;
	private static GoogleSignInResult googleSignInResult;

	private static final int RC_SIGN_IN = 9001;
	private static CallbackContext callback = null;
	private Boolean cachedSignIn = false;
	private Context context;

	public boolean execute(String action, JSONArray args, CallbackContext callbackContext) {
		try {
			context = getActivity().getApplicationContext();
			GoogleSignInOptions gso = new GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
					.requestEmail()
					.build();
			if(mGoogleApiClient == null) {
				mGoogleApiClient = new GoogleApiClient.Builder(context)
//						.enableAutoManage(getSupportFragmentManager() /* FragmentActivity */, this /* OnConnectionFailedListener */)
						.addApi(Auth.GOOGLE_SIGN_IN_API, gso)
						.build();
				mGoogleApiClient.connect();
			}
//			else if (!mGoogleApiClient.isConnecting() && !mGoogleApiClient.isConnected()) {
//				Log.d(TAG, "mGoogleApiClient not connected");
//				mGoogleApiClient.connect();
//			}

			OptionalPendingResult<GoogleSignInResult> opr = Auth.GoogleSignInApi.silentSignIn(mGoogleApiClient);
			if (opr.isDone()) {
				// If the user's cached credentials are valid, the OptionalPendingResult will be "done"
				// and the GoogleSignInResult will be available instantly.
				Log.d(TAG, "Got cached sign-in");
				googleSignInResult = opr.get();
				handleSignInResult(googleSignInResult);
				cachedSignIn = true;
			} else {
				// If the user has not previously signed in on this device or the sign-in has expired,
				// this asynchronous branch will attempt to sign in the user silently.  Cross-device
				// single sign-on will occur in this branch.
//				showProgressDialog();
				opr.setResultCallback(new ResultCallback<GoogleSignInResult>() {
					@Override
					public void onResult(GoogleSignInResult newGoogleSignInResult) {
//						hideProgressDialog();
						googleSignInResult = newGoogleSignInResult;
						handleSignInResult(googleSignInResult);
					}
				});
			}
			if (action.equals("captureMrz")) {
				Log.d(TAG, "TEST from plugin");
			}
			if (action.equals("getGoogleApiClientStatus")) {
				Log.d(TAG, "getGoogleApiClientStatus");
				callback = callbackContext;
				JSONObject googleApiClientStatus = new JSONObject();
				if(mGoogleApiClient != null && googleSignInResult != null) {
					googleSignInResult.getStatus();
					try {
						googleApiClientStatus.put("mGoogleApiClient", "null");
					} catch (JSONException e) {
//						LogConsole.e(TAG, "Error setting packageInfo?", e);
					}
				}
				if(mGoogleApiClient == null) {
					try {
						googleApiClientStatus.put("mGoogleApiClient", "null");
					} catch (JSONException e) {
//						LogConsole.e(TAG, "Error setting packageInfo?", e);
					}
					callback.success(googleApiClientStatus);
					return true;
				}
				if(googleSignInResult == null) {
					googleApiClientStatus.put("googleSignInResult", "null");
					callback.success(googleApiClientStatus);
				}
				if(mGoogleApiClient != null && googleSignInResult != null) {
					try {
						googleApiClientStatus.put("mGoogleApiClientStatus", googleSignInResult.getStatus().toString());
					} catch (JSONException e) {
					}
					callback.success(googleApiClientStatus);
					return true;
				}
				try {
					googleApiClientStatus.put("NoStatus", "Couldn't figure what to do");
				} catch (JSONException e) {
				}
				callback.success(googleApiClientStatus);
				return true;
			}
			if (action.equals("signIn")) {
				Log.d(TAG, "Try signIn");
//				callback = callbackContext;
				if(!cachedSignIn) {
					PluginResult result = new PluginResult(PluginResult.Status.NO_RESULT);
					result.setKeepCallback(true);
					callbackContext.sendPluginResult(result);
					getActivity().runOnUiThread(new Runnable() {
						public void run() {
							tempSignIn();
						}
					});
				}
				if(googleSignInResult != null && googleSignInResult.isSuccess()) {
					Log.d(TAG, "cached sign in email address: " + googleSignInResult.getSignInAccount().getEmail());
				}

				return true;
			}

			if (action.equals("disconnect")) {
				Log.d(TAG, "Revoke Access");
				revokeAccess();
				return true;
			}
			callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.INVALID_ACTION));
		} catch (Exception exception) {
			Log.d(TAG, "exception: ", exception);
		}
		return false;
	}

	private void handleSignInResult(GoogleSignInResult result) {
		Log.d(TAG, "handleSignInResult:" + result.isSuccess());
		if (result.isSuccess()) {
			// Signed in successfully, show authenticated UI.
			GoogleSignInAccount acct = result.getSignInAccount();
		} else {
			// Signed out, show unauthenticated UI.
//			updateUI(false);
			Log.d(TAG, "Signed Out");
		}
	}

	@Override
	public void onConnectionFailed(ConnectionResult connectionResult) {
		// An unresolvable error has occurred and Google APIs (including Sign-In) will not
		// be available.
		Log.d(TAG, "onConnectionFailed:" + connectionResult);
	}

	private void tempSignIn() {
		Intent signInIntent = Auth.GoogleSignInApi.getSignInIntent(mGoogleApiClient);
		getActivity().startActivityForResult(signInIntent, RC_SIGN_IN); // working
	}

	private void revokeAccess() {
		Auth.GoogleSignInApi.revokeAccess(mGoogleApiClient).setResultCallback(
				new ResultCallback<Status>() {
					@Override
					public void onResult(Status status) {
						Log.d(TAG, "Status: " + status);
					}
				});
	}

	@Override
	public void onActivityResult(int requestCode, int resultCode, Intent data) {
		Log.d(TAG, "requestCode: 9001? " + requestCode);
		if (requestCode == RC_SIGN_IN) {
			GoogleSignInResult result = Auth.GoogleSignInApi.getSignInResultFromIntent(data);
			JSONObject sendBackResult = new JSONObject();
			if (result.isSuccess()) {
				GoogleSignInAccount acct = result.getSignInAccount();
				try {
					sendBackResult.put("fullName", acct.getDisplayName());
					sendBackResult.put("eMail", acct.getEmail());
					Log.d(TAG, "fullName: " +  acct.getDisplayName());
				} catch (JSONException e) {
					Log.e(TAG, "JSONException error: ", e);
				}
			}
			callback.success(sendBackResult);
			callback = null;
		}
		super.onActivityResult(requestCode, resultCode, data);
	}


}