from setuptools import find_namespace_packages
from setuptools import setup

setup_args = dict(
    name="newmedia",
    version="0.0.1",
    license="Apache License, Version 2.0",
    maintainer="Misha Bushkov",
    maintainer_email="realbushman@gmail.com",
    packages=find_namespace_packages(),
    entry_points={"console_scripts": ["newmedia_backend = newmedia.main:main", ]},
    install_requires=[
        "aiohttp[speedups]==3.8.3",
        "aiojobs==1.0.0",
        "aiosqlite==0.17.0",
        "bson==0.5.10",
        "imagecodecs==2021.6.8",  # implicit dependency of tifffile
        "pillow==9.2.0",
        "pyobjc-core==8.5.1",
        "pyobjc-framework-Cocoa==8.5.1",
        "pyobjc-framework-LaunchServices==8.5.1",
        "rawpy==0.16.0",
        "tifffile==2021.3.17",
        "watchdog==2.1.9",
    ],
    extras_require={
        "dev": ["pyinstaller==4.2"],
    },
    data_files=[],
)

setup(**setup_args)
