package com.nexus.rinde.mobile.data.remote

import java.io.IOException

class ApiException(val status: Int, message: String) : IOException(message)
