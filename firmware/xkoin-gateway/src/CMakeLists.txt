# Main component. PlatformIO generated the first version of this file and
# only globbed src/, which left every lib/ symbol undefined at link time
# (kq130f_rx_feed, captive_portal_start). The portable core under lib/ is
# registered here explicitly; the same list the host proof compiles, plus the
# ESP-IDF glue libraries.

FILE(GLOB_RECURSE app_sources ${CMAKE_SOURCE_DIR}/src/*.c)

set(XK_LIB ${CMAKE_SOURCE_DIR}/lib)
set(XK_ED ${XK_LIB}/ed25519)

set(xk_lib_sources
    ${XK_LIB}/xkp/frames.c
    ${XK_LIB}/xkp/receipt.c
    ${XK_LIB}/xkp/medium.c
    ${XK_LIB}/router/classifier.c
    ${XK_LIB}/kq130f/kq130f.c
    ${XK_LIB}/xkcrypto/sha256.c
    ${XK_LIB}/wifi_ap/captive_portal.c
    ${XK_ED}/verify.c
    ${XK_ED}/sc.c
    ${XK_ED}/fe.c
    ${XK_ED}/ge.c
    ${XK_ED}/sha512.c
)

idf_component_register(
    SRCS ${app_sources} ${xk_lib_sources}
    INCLUDE_DIRS ${XK_LIB} ${XK_ED}
)
