from setuptools import find_namespace_packages
from setuptools import setup

setup_args = dict(
    name="newmedia",
    version="0.0.1",
    license="Apache License, Version 2.0",
    maintainer="Misha Bushkov",
    maintainer_email="realbushman@gmail.com",
    packages=find_namespace_packages(),
    entry_points={"console_scripts": ["newmedia_backend = newmedia.main:main",]},
    install_requires=[
        "aiohttp[speedups]==3.7.4.post0",
        "aiojobs==0.3.0",
        "aiosqlite==0.17.0",
        "bson==0.5.10",
        "imagecodecs==2021.6.8",  # implicit dependency of tifffile
        "pillow==8.3.1",
        "portpicker==1.3.1",
        "pyobjc==7.1",
        "rawpy==0.16.0",
        "tifffile==2021.3.17",
    ],
    extras_require={
        "dev": ["pyinstaller==4.2"],
    },
    data_files=[],
)

setup(**setup_args)
